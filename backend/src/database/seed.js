import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import Book from "../models/Book.js";
import Ticket from "../models/Ticket.js";
import { classifyAndScoreTicket, generateAiDraftResponse } from "../services/aiService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

export const seedDatabase = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/bookleaf";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUrl);
      console.log("Connected to MongoDB for seeding...");
    }

    // Read sample JSON
    const dataPath = path.join(__dirname, "../data/bookleaf_sample_data.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const { authors } = JSON.parse(rawData);

    // Clear old data
    console.log("Cleaning existing database collections...");
    await User.deleteMany({});
    await Book.deleteMany({});
    await Ticket.deleteMany({});

    // 1. Create Admin User
    const adminUser = await User.create({
      name: "BookLeaf Operations Admin",
      email: "admin@bookleaf.com",
      password: "admin123",
      role: "admin",
      phone: "+91-99999-00000",
      city: "Delhi",
    });
    console.log("Admin account created: admin@bookleaf.com / admin123");

    // 2. Create Authors & Books
    const createdAuthors = [];
    const createdBooks = [];

    for (const authorData of authors) {
      const authorUser = await User.create({
        name: authorData.name,
        email: authorData.email.toLowerCase(),
        password: "password123",
        role: "author",
        authorId: authorData.author_id,
        phone: authorData.phone,
        city: authorData.city,
        joinedDate: authorData.joined_date,
        bankDetails: {
          accountHolder: authorData.name,
          accountNumber: "91028374" + Math.floor(1000 + Math.random() * 9000),
          ifscCode: "HDFC0001234",
          bankName: "HDFC Bank",
        },
      });

      createdAuthors.push(authorUser);

      for (const bookData of authorData.books) {
        const book = await Book.create({
          bookId: bookData.book_id,
          authorId: authorData.author_id,
          authorUser: authorUser._id,
          title: bookData.title,
          isbn: bookData.isbn,
          genre: bookData.genre,
          publicationDate: bookData.publication_date,
          status: bookData.status,
          mrp: bookData.mrp,
          authorRoyaltyPerCopy: bookData.author_royalty_per_copy,
          totalCopiesSold: bookData.total_copies_sold || 0,
          totalRoyaltyEarned: bookData.total_royalty_earned || 0,
          royaltyPaid: bookData.royalty_paid || 0,
          royaltyPending: bookData.royalty_pending || 0,
          lastRoyaltyPayoutDate: bookData.last_royalty_payout_date,
          printPartner: bookData.print_partner,
          availableOn: bookData.available_on || [],
        });
        createdBooks.push(book);
      }
    }

    console.log(`Seeded ${createdAuthors.length} authors and ${createdBooks.length} books.`);

    // 3. Seed Realistic Support Tickets from PDF requirements
    const sampleTicketsSeed = [
      {
        authorEmail: "priya.sharma@email.com",
        bookId: "BK001",
        bookTitle: "Whispers of the Ganges",
        subject: "I published my book 4 months ago and still haven't received any royalty. What's going on?",
        description: "Hello Team, It has been over four months since my book went live. My sales counter shows 342 copies sold, but I haven't received any quarterly payout in my bank account yet. Please resolve this urgently.",
        status: "Open",
      },
      {
        authorEmail: "rohit.kapoor@email.com",
        bookId: "BK003",
        bookTitle: "Code & Karma",
        subject: "My royalty amount seems too low. I sold 876 copies but the calculation is unclear.",
        description: "Hi BookLeaf team, I see 876 copies sold and total royalty calculated as ₹26,280, but I wanted a detailed line-by-line breakdown of printing costs, platform commission, and shipping deductions per platform.",
        status: "In Progress",
        replies: [
          {
            senderRole: "admin",
            senderName: "BookLeaf Operations Admin",
            content: "Hello Rohit, thank you for reaching out. We are pulling up your platform channel ledger (Amazon India, Flipkart, Amazon US) to share the exact 80/20 net profit statement for the quarter.",
          },
        ],
        notes: ["Finance team contacted to export Q3 royalty report."],
      },
      {
        authorEmail: "ananya.reddy@email.com",
        bookId: "BK005",
        bookTitle: "Between Two Temples",
        subject: "My book is showing a different ISBN on Amazon than what's on the physical copy.",
        description: "Urgent issue: When I search for my book on Amazon India, the listed ISBN does not match the 978-93-5XXXX-05-9 printed on my author copies. Readers are confused.",
        status: "Open",
      },
      {
        authorEmail: "vikram.joshi@email.com",
        bookId: "BK006",
        bookTitle: "Debugging Life",
        subject: "I received my author copies and the print quality is terrible. The images are blurry and pages are misaligned.",
        description: "Received a box of 10 author copies today from Repro India. The cover colors look faded and chapter headings on odd pages are cropped. I have photos ready to share.",
        attachmentName: "defective_print_sample.jpg",
        status: "Open",
      },
      {
        authorEmail: "meera.nair@email.com",
        bookId: "BK008",
        bookTitle: "Cardamom & Chaos",
        subject: "My book is published but it's showing as 'Currently Unavailable' on Amazon.",
        description: "My readers told me today that Cardamom & Chaos shows 'Currently Unavailable' on Amazon India. Is it out of stock or is there a catalog issue?",
        status: "Resolved",
        replies: [
          {
            senderRole: "admin",
            senderName: "BookLeaf Operations Admin",
            content: "Hello Meera, this was an automated warehouse sync delay on Amazon's end. We triggered an inventory re-sync with our Delhi fulfillment center and the listing is now active with the Buy Now button enabled.",
          },
        ],
      },
      {
        authorEmail: "kavita.deshmukh@email.com",
        bookId: "BK015",
        bookTitle: "Raising Roots",
        subject: "It's been 3 weeks and my book is still in typesetting. When will it be done?",
        description: "Checking in regarding Raising Roots. The manuscript was cleared 3 weeks ago, but the dashboard still displays 'In Production - Typesetting'. Could you share the estimated completion date?",
        status: "In Progress",
      },
      {
        authorEmail: "arjun.malhotra@email.com",
        bookId: null,
        bookTitle: "General / Account Level",
        subject: "Can I update the description of my book on Amazon after it's already live?",
        description: "Hello, I recently won an indie essay award and would like to append the award accolade to my book's back cover blurb on Amazon and BookLeaf Store.",
        status: "Open",
      },
    ];

    for (let i = 0; i < sampleTicketsSeed.length; i++) {
      const item = sampleTicketsSeed[i];
      const author = createdAuthors.find((a) => a.email === item.authorEmail);
      if (!author) continue;

      const ticketNumber = `TICK-${1000 + i + 1}`;
      const { category, priority } = classifyAndScoreTicket(item.subject, item.description);

      const aiDraft = generateAiDraftResponse({
        authorName: author.name,
        bookTitle: item.bookTitle,
        subject: item.subject,
        description: item.description,
        category,
        priority,
      });

      const messages = [];
      if (item.replies && item.replies.length > 0) {
        for (const r of item.replies) {
          messages.push({
            senderId: adminUser._id,
            senderName: r.senderName,
            senderRole: r.senderRole,
            content: r.content,
            createdAt: new Date(Date.now() - 3600000),
          });
        }
      }

      const internalNotes = [];
      if (item.notes && item.notes.length > 0) {
        for (const n of item.notes) {
          internalNotes.push({
            adminId: adminUser._id,
            adminName: adminUser.name,
            note: n,
            createdAt: new Date(Date.now() - 1800000),
          });
        }
      }

      await Ticket.create({
        ticketNumber,
        authorUser: author._id,
        authorId: author.authorId,
        authorName: author.name,
        authorEmail: author.email,
        bookId: item.bookId,
        bookTitle: item.bookTitle,
        subject: item.subject,
        description: item.description,
        attachmentName: item.attachmentName || null,
        category,
        priority,
        status: item.status,
        assignedTo: adminUser._id,
        assignedToName: adminUser.name,
        aiDraftResponse: {
          content: aiDraft,
          generatedAt: new Date(),
          categorySuggested: category,
          prioritySuggested: priority,
          status: "ready",
        },
        messages,
        internalNotes,
        createdAt: new Date(Date.now() - (sampleTicketsSeed.length - i) * 86400000),
      });
    }

    console.log(`Seeded ${sampleTicketsSeed.length} starter tickets.`);
    console.log("\n=======================================================");
    console.log("Database successfully seeded!");
    console.log("Admin login: admin@bookleaf.com | admin123");
    console.log("Author login (any author in sample data):");
    console.log("  e.g. priya.sharma@email.com | password123");
    console.log("  e.g. rohit.kapoor@email.com | password123");
    console.log("=======================================================\n");

    return true;
  } catch (error) {
    console.error("Seeding error:", error);
    throw error;
  }
};

// Allow direct CLI execution: node src/database/seed.js
if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

