import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["author", "admin"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const internalNoteSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminName: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    authorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    authorId: {
      type: String,
      default: "",
    },
    authorName: {
      type: String,
      required: true,
    },
    authorEmail: {
      type: String,
      required: true,
    },
    bookId: {
      type: String,
      default: null, // "BK001" or null for general
    },
    bookTitle: {
      type: String,
      default: "General / Account Level",
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    attachmentName: {
      type: String,
      default: null,
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      enum: [
        "Royalty & Payments",
        "ISBN & Metadata Issues",
        "Printing & Quality",
        "Distribution & Availability",
        "Book Status & Production Updates",
        "General Inquiry",
      ],
      default: "General Inquiry",
    },
    priority: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedToName: {
      type: String,
      default: "Unassigned",
    },
    aiDraftResponse: {
      content: { type: String, default: "" },
      generatedAt: { type: Date, default: null },
      categorySuggested: { type: String, default: "" },
      prioritySuggested: { type: String, default: "" },
      status: { type: String, default: "ready" }, // "ready", "edited", "sent"
    },
    messages: [messageSchema],
    internalNotes: [internalNoteSchema],
  },
  { timestamps: true }
);

// Indexes for fast searching and filtering
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ category: 1 });

const Ticket = mongoose.model("Ticket", ticketSchema);
export default Ticket;

