import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Book from "../models/Book.js";
import Ticket from "../models/Ticket.js";

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || "bookleaf_jwt_super_secret_key_2026_xyz";
  return jwt.sign({ id }, secret, { expiresIn: "7d" });
};

// @route   POST /api/auth/register
// @desc    Register a new user (author or admin)
export const register = async (req, res) => {
  try {
    const { name, email, password, role = "author", phone = "", city = "" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Auto-generate authorId if author role
    let authorId = "";
    if (role === "author") {
      const count = await User.countDocuments({ role: "author" });
      authorId = `AUTH${String(count + 1).padStart(3, "0")}`;
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      authorId,
      phone,
      city,
    });

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authorId: user.authorId,
        phone: user.phone,
        city: user.city,
        bankDetails: user.bankDetails,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while registering.",
    });
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Signed in successfully.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authorId: user.authorId,
        phone: user.phone,
        city: user.city,
        bankDetails: user.bankDetails,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while logging in.",
    });
  }
};

// @route   GET /api/auth/me
// @desc    Get current logged in user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error fetching user profile.",
    });
  }
};

// @route   PATCH /api/auth/profile
// @desc    Update author details (phone, city, bank details)
export const updateProfile = async (req, res) => {
  try {
    const { phone, city, bankDetails } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (phone !== undefined) user.phone = phone;
    if (city !== undefined) user.city = city;
    if (bankDetails) {
      user.bankDetails = {
        ...user.bankDetails,
        ...bankDetails,
      };
    }

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authorId: user.authorId,
        phone: user.phone,
        city: user.city,
        bankDetails: user.bankDetails,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/auth/authors (Admin only)
// @desc    Get all authors with their book counts and royalty totals
export const getAllAuthors = async (req, res) => {
  try {
    const authors = await User.find({ role: "author" }).select("-password").lean();

    // Attach summary stats for each author
    const authorsWithData = await Promise.all(
      authors.map(async (author) => {
        const books = await Book.find({
          $or: [{ authorUser: author._id }, { authorId: author.authorId }],
        });

        const totalCopiesSold = books.reduce((acc, b) => acc + (b.totalCopiesSold || 0), 0);
        const totalRoyaltyEarned = books.reduce((acc, b) => acc + (b.totalRoyaltyEarned || 0), 0);
        const royaltyPaid = books.reduce((acc, b) => acc + (b.royaltyPaid || 0), 0);
        const royaltyPending = books.reduce((acc, b) => acc + (b.royaltyPending || 0), 0);

        return {
          ...author,
          booksCount: books.length,
          totalCopiesSold,
          totalRoyaltyEarned,
          royaltyPaid,
          royaltyPending,
        };
      })
    );

    return res.json({
      success: true,
      authors: authorsWithData,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/auth/stats (Admin only)
// @desc    Get dashboard metrics for operations team
export const getAdminStats = async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: "Open" });
    const inProgressTickets = await Ticket.countDocuments({ status: "In Progress" });
    const resolvedTickets = await Ticket.countDocuments({ status: "Resolved" });
    const criticalTickets = await Ticket.countDocuments({
      priority: "Critical",
      status: { $in: ["Open", "In Progress"] },
    });
    const highTickets = await Ticket.countDocuments({
      priority: "High",
      status: { $in: ["Open", "In Progress"] },
    });
    const totalAuthors = await User.countDocuments({ role: "author" });
    const totalBooks = await Book.countDocuments();

    return res.json({
      success: true,
      stats: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        criticalTickets,
        highTickets,
        totalAuthors,
        totalBooks,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

