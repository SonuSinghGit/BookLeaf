import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    bookId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    authorId: {
      type: String,
      required: true,
      index: true,
    },
    authorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
    },
    isbn: {
      type: String,
      default: null,
      trim: true,
    },
    genre: {
      type: String,
      default: "Uncategorized",
    },
    publicationDate: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      required: true,
      default: "In Production",
    },
    mrp: {
      type: Number,
      default: null,
    },
    authorRoyaltyPerCopy: {
      type: Number,
      default: null,
    },
    totalCopiesSold: {
      type: Number,
      default: 0,
    },
    totalRoyaltyEarned: {
      type: Number,
      default: 0,
    },
    royaltyPaid: {
      type: Number,
      default: 0,
    },
    royaltyPending: {
      type: Number,
      default: 0,
    },
    lastRoyaltyPayoutDate: {
      type: String,
      default: null,
    },
    printPartner: {
      type: String,
      default: null,
    },
    availableOn: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const Book = mongoose.model("Book", bookSchema);
export default Book;

