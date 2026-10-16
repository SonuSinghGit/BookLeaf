import express from "express";
import {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  overrideClassification,
  assignTicket,
  addInternalNote,
  addMessage,
  regenerateAiDraft,
} from "../controllers/ticket.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Author routes
router.post("/", protect, createTicket);
router.get("/my-tickets", protect, getMyTickets);

// Common / Detail routes
router.get("/:id", protect, getTicketById);
router.post("/:id/messages", protect, addMessage);

// Admin-only operations
router.get("/", protect, authorize("admin"), getAllTickets);
router.patch("/:id/status", protect, authorize("admin"), updateTicketStatus);
router.patch("/:id/classification", protect, authorize("admin"), overrideClassification);
router.patch("/:id/assign", protect, authorize("admin"), assignTicket);
router.post("/:id/internal-notes", protect, authorize("admin"), addInternalNote);
router.post("/:id/ai-draft", protect, authorize("admin"), regenerateAiDraft);

export default router;

