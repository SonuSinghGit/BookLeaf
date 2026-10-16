import Ticket from "../models/Ticket.js";
import Book from "../models/Book.js";
import { classifyAndScoreTicket, generateAiDraftResponse } from "../services/aiService.js";

// Helper to broadcast socket events safely
const emitSocketEvent = (req, event, data) => {
  const io = req.app.get("io");
  if (io) {
    io.emit(event, data);
  }
};

// @route   POST /api/tickets
// @desc    Create a new support ticket (Author)
export const createTicket = async (req, res) => {
  try {
    const { subject, description, bookId, bookTitle, attachmentName, attachmentUrl } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Subject and detailed description are required.",
      });
    }

    // Auto-generate ticket number
    const count = await Ticket.countDocuments();
    const ticketNumber = `TICK-${1000 + count + 1}`;

    // Auto-classification and priority scoring via AI
    const { category, priority } = await classifyAndScoreTicket(subject, description);

    // Resolved book title
    let resolvedBookTitle = bookTitle || "General / Account Level";
    if (bookId && (!bookTitle || bookTitle === "General / Account Level")) {
      const bookObj = await Book.findOne({ bookId });
      if (bookObj) {
        resolvedBookTitle = bookObj.title;
      }
    }

    // Generate initial AI draft for admin operations
    const aiDraftContent = await generateAiDraftResponse({
      authorName: req.user.name,
      bookTitle: resolvedBookTitle,
      subject,
      description,
      category,
      priority,
    });

    const ticket = await Ticket.create({
      ticketNumber,
      authorUser: req.user._id,
      authorId: req.user.authorId || "",
      authorName: req.user.name,
      authorEmail: req.user.email,
      bookId: bookId || null,
      bookTitle: resolvedBookTitle,
      subject,
      description,
      attachmentName: attachmentName || null,
      attachmentUrl: attachmentUrl || null,
      category,
      priority,
      status: "Open",
      aiDraftResponse: {
        content: aiDraftContent,
        generatedAt: new Date(),
        categorySuggested: category,
        prioritySuggested: priority,
        status: "ready",
      },
      messages: [],
      internalNotes: [],
    });

    // Notify admins in real-time
    emitSocketEvent(req, "new_ticket", ticket);

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully.",
      ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create ticket.",
    });
  }
};

// @route   GET /api/tickets/my-tickets
// @desc    Get all tickets submitted by author
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ authorUser: req.user._id })
      .select("-internalNotes -aiDraftResponse") // Never expose internal notes or AI draft metadata to author
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch tickets.",
    });
  }
};

// @route   GET /api/tickets (Admin only)
// @desc    Get ticket queue with filters and smart sorting
export const getAllTickets = async (req, res) => {
  try {
    const { status, category, priority, search, sortBy } = req.query;
    const query = {};

    if (status && status !== "All") {
      query.status = status;
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (priority && priority !== "All") {
      query.priority = priority;
    }

    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { authorName: { $regex: search, $options: "i" } },
        { authorEmail: { $regex: search, $options: "i" } },
        { bookTitle: { $regex: search, $options: "i" } },
      ];
    }

    let sort = { createdAt: -1 }; // default newest

    if (sortBy === "urgent") {
      // Prioritize Critical & High, then oldest
      sort = {
        priority: 1, // in mongo we will sort or sort in memory
        createdAt: 1,
      };
    } else if (sortBy === "oldest") {
      sort = { createdAt: 1 };
    }

    let tickets = await Ticket.find(query).sort(sort).lean();

    // Custom sorting if urgent chosen: Critical > High > Medium > Low, unresolved first
    if (sortBy === "urgent") {
      const priorityOrder = { Critical: 1, High: 2, Medium: 3, Low: 4 };
      const statusOrder = { Open: 1, "In Progress": 2, Resolved: 3, Closed: 4 };

      tickets = tickets.sort((a, b) => {
        const pA = priorityOrder[a.priority] || 5;
        const pB = priorityOrder[b.priority] || 5;
        if (pA !== pB) return pA - pB;

        const sA = statusOrder[a.status] || 5;
        const sB = statusOrder[b.status] || 5;
        if (sA !== sB) return sA - sB;

        return new Date(a.createdAt) - new Date(b.createdAt);
      });
    }

    return res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch ticket queue.",
    });
  }
};

// @route   GET /api/tickets/:id
// @desc    Get ticket details
export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    // Role check: Author can only see their own tickets
    if (req.user.role !== "admin" && String(ticket.authorUser) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to view this ticket.",
      });
    }

    // Authors should NEVER see internal notes or internal AI draft fields
    if (req.user.role !== "admin") {
      const sanitized = ticket.toObject();
      delete sanitized.internalNotes;
      delete sanitized.aiDraftResponse;
      return res.json({ success: true, ticket: sanitized });
    }

    return res.json({ success: true, ticket });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PATCH /api/tickets/:id/status
// @desc    Update ticket status (Admin)
export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Open", "In Progress", "Resolved", "Closed"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowed.join(", ")}`,
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    ticket.status = status;
    await ticket.save();

    emitSocketEvent(req, "ticket_updated", ticket);

    return res.json({
      success: true,
      message: `Status updated to ${status}.`,
      ticket,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PATCH /api/tickets/:id/classification
// @desc    Override Category and Priority (Admin)
export const overrideClassification = async (req, res) => {
  try {
    const { category, priority } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    if (category) ticket.category = category;
    if (priority) ticket.priority = priority;

    await ticket.save();
    emitSocketEvent(req, "ticket_updated", ticket);

    return res.json({
      success: true,
      message: "Ticket classification updated.",
      ticket,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PATCH /api/tickets/:id/assign
// @desc    Assign ticket to admin (Admin)
export const assignTicket = async (req, res) => {
  try {
    const { adminId, adminName } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    ticket.assignedTo = adminId || req.user._id;
    ticket.assignedToName = adminName || req.user.name;

    await ticket.save();
    emitSocketEvent(req, "ticket_updated", ticket);

    return res.json({
      success: true,
      message: `Ticket assigned to ${ticket.assignedToName}.`,
      ticket,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/tickets/:id/internal-notes
// @desc    Add internal note (Admin only - invisible to author)
export const addInternalNote = async (req, res) => {
  try {
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: "Note text is required." });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    ticket.internalNotes.push({
      adminId: req.user._id,
      adminName: req.user.name,
      note: note.trim(),
      createdAt: new Date(),
    });

    await ticket.save();
    emitSocketEvent(req, "ticket_updated", ticket);

    return res.json({
      success: true,
      message: "Internal note added.",
      internalNotes: ticket.internalNotes,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/tickets/:id/messages
// @desc    Send response / reply to ticket (Author or Admin)
export const addMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Message content cannot be empty." });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    // Role check: Author can only send messages to their own ticket
    if (req.user.role !== "admin" && String(ticket.authorUser) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden." });
    }

    const newMessage = {
      senderId: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      content: content.trim(),
      createdAt: new Date(),
    };

    ticket.messages.push(newMessage);

    // If admin is replying and ticket was "Open", move to "In Progress"
    if (req.user.role === "admin" && ticket.status === "Open") {
      ticket.status = "In Progress";
    }

    await ticket.save();

    // Broadcast message event and ticket updated event
    emitSocketEvent(req, "ticket_message", {
      ticketId: ticket._id,
      message: newMessage,
      ticketStatus: ticket.status,
    });
    emitSocketEvent(req, "ticket_updated", ticket);

    return res.json({
      success: true,
      message: "Message sent successfully.",
      ticket,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/tickets/:id/ai-draft
// @desc    Regenerate AI Draft response (Admin only)
export const regenerateAiDraft = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    const draft = await generateAiDraftResponse({
      authorName: ticket.authorName,
      bookTitle: ticket.bookTitle,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
    });

    ticket.aiDraftResponse = {
      content: draft,
      generatedAt: new Date(),
      categorySuggested: ticket.category,
      prioritySuggested: ticket.priority,
      status: "ready",
    };

    await ticket.save();

    return res.json({
      success: true,
      aiDraft: ticket.aiDraftResponse,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

