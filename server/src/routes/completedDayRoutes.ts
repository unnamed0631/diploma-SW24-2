import express from "express";
import {
  addCompletedDay,
  getCompletedDaysForMonth,
  incrementStreak,
} from "../controllers/completedDayController";
import { authenticate } from "@/controllers/token"; // Corrected auth middleware path

const router = express.Router();

// POST /api/v1/users/completed-days - userId will be taken from authenticated user (req.user.id)
router.post("/completed-days", authenticate, addCompletedDay);

// GET /api/v1/users/completed-days?month=YYYY-MM - userId will be taken from authenticated user
router.get("/completed-days", authenticate, getCompletedDaysForMonth);

// POST /api/v1/streak/increment - server-owned streak increment for today (Asia/Ulaanbaatar)
router.post("/increment", authenticate, incrementStreak);

export default router;
