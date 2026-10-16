import express from "express";
import {
  getMyBooks,
  getAllBooks,
  getBookById,
} from "../controllers/book.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/my-books", protect, getMyBooks);
router.get("/all", protect, authorize("admin"), getAllBooks);
router.get("/:id", protect, getBookById);

export default router;

