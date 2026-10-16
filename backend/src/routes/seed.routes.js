import express from "express";
import { seedDatabase } from "../database/seed.js";

const router = express.Router();

router.all("/", async (req, res) => {
  try {
    await seedDatabase();
    return res.json({
      success: true,
      message: "Database seeded successfully with BookLeaf sample dataset, admin, and tickets.",
      credentials: {
        admin: { email: "admin@bookleaf.com", password: "admin123" },
        sampleAuthors: [
          { email: "priya.sharma@email.com", password: "password123" },
          { email: "rohit.kapoor@email.com", password: "password123" },
          { email: "ananya.reddy@email.com", password: "password123" },
        ],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to seed database.",
    });
  }
});

export default router;

