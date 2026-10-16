import Book from "../models/Book.js";

// @route   GET /api/books/my-books
// @desc    Get all books for the authenticated author
export const getMyBooks = async (req, res) => {
  try {
    const authorUser = req.user;
    const query = {
      $or: [
        { authorUser: authorUser._id },
        ...(authorUser.authorId ? [{ authorId: authorUser.authorId }] : []),
      ],
    };

    const books = await Book.find(query).sort({ publicationDate: -1, createdAt: -1 });

    // Aggregate author financial summary
    const summary = books.reduce(
      (acc, b) => {
        acc.totalCopiesSold += b.totalCopiesSold || 0;
        acc.totalRoyaltyEarned += b.totalRoyaltyEarned || 0;
        acc.royaltyPaid += b.royaltyPaid || 0;
        acc.royaltyPending += b.royaltyPending || 0;
        return acc;
      },
      {
        totalCopiesSold: 0,
        totalRoyaltyEarned: 0,
        royaltyPaid: 0,
        royaltyPending: 0,
        booksCount: books.length,
      }
    );

    return res.json({
      success: true,
      summary,
      books,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error retrieving books.",
    });
  }
};

// @route   GET /api/books/all (Admin only)
// @desc    Get all books in the catalog
export const getAllBooks = async (req, res) => {
  try {
    const { status, genre, search } = req.query;
    const query = {};

    if (status && status !== "All") {
      query.status = status;
    }

    if (genre && genre !== "All") {
      query.genre = genre;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { isbn: { $regex: search, $options: "i" } },
        { authorId: { $regex: search, $options: "i" } },
      ];
    }

    const books = await Book.find(query).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: books.length,
      books,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error retrieving all books.",
    });
  }
};

// @route   GET /api/books/:id
// @desc    Get single book details
export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found." });
    }

    // Role check: Author can only access their own book
    if (
      req.user.role !== "admin" &&
      book.authorId !== req.user.authorId &&
      String(book.authorUser) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have access to this book.",
      });
    }

    return res.json({ success: true, book });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

