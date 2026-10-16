import express from "express";
import {
  register,
  login,
  getMe,
  updateProfile,
  getAllAuthors,
  getAdminStats,
} from "../controllers/auth.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);
router.get("/authors", protect, authorize("admin"), getAllAuthors);
router.get("/stats", protect, authorize("admin"), getAdminStats);

export default router;

