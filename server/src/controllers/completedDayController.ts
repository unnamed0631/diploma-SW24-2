import { Response } from "express";
import CompletedDay from "@/models/CompletedDay";
import User from "@/models/user"; // Corrected import casing
import mongoose from "mongoose";
import { AuthenticatedRequest } from "./token";

const STREAK_TIMEZONE = "Asia/Ulaanbaatar";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// CompletedDay entries store UTC midnight of a calendar day (see addCompletedDay).
// Resolve "today" in the streak timezone and normalize it the same way so the
// consecutive-day walk can step by exactly one day.
const getTodayUtcMidnight = (now: Date = new Date()): Date => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STREAK_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00.000Z`);
};

const computeConsecutiveStreak = async (
  userId: string,
  todayUtcMidnight: Date,
): Promise<number> => {
  const completedDays = await CompletedDay.find({ userId })
    .select("date")
    .lean();
  const completedTimestamps = new Set(
    completedDays.map((day) => new Date(day.date).getTime()),
  );

  let streak = 0;
  let cursor = todayUtcMidnight.getTime();
  while (completedTimestamps.has(cursor)) {
    streak += 1;
    cursor -= MS_PER_DAY;
  }

  return streak;
};

/**
 * `streak`/`highestStreak` are derived from CompletedDay, so every write path
 * (adding a day, explicit increment) funnels through here to keep them in sync.
 * Safe to call repeatedly: recomputation is idempotent.
 */
const recomputeAndPersistStreak = async (userId: string) => {
  const user = await User.findById(userId).select("streak highestStreak");
  if (!user) return null;

  const todayUtcMidnight = getTodayUtcMidnight();
  const streak = await computeConsecutiveStreak(userId, todayUtcMidnight);
  const highestStreak = Math.max(user.highestStreak ?? 0, streak);

  await User.findByIdAndUpdate(userId, {
    $set: { streak, highestStreak, lastStreakUpdate: new Date() },
  });

  return { streak, highestStreak };
};

export const addCompletedDay = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user.id;
    const { date } = req.body; // Expecting date in 'YYYY-MM-DD' format string

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: "Invalid user ID format." });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res
        .status(400)
        .json({ message: "Invalid date format. Please use YYYY-MM-DD." });
      return;
    }

    const targetDate = new Date(date + "T00:00:00.000Z");

    const existingEntry = await CompletedDay.findOne({
      userId,
      date: targetDate,
    });
    if (existingEntry) {
      // Keep the derived streak in sync even when the day already existed.
      const streakState = await recomputeAndPersistStreak(userId);
      res.status(200).json({
        message: "Day already marked as completed.",
        completedDay: existingEntry,
        ...(streakState ?? {}),
      });
      return;
    }

    const newCompletedDay = new CompletedDay({
      userId,
      date: targetDate,
    });

    await newCompletedDay.save();
    const streakState = await recomputeAndPersistStreak(userId);

    res.status(201).json({
      message: "Day marked as completed successfully.",
      completedDay: newCompletedDay,
      ...(streakState ?? {}),
    });
  } catch (error) {
    console.error("Error adding completed day:", error);
    if (error instanceof Error) {
      res.status(500).json({
        message: "Server error adding completed day.",
        error: error.message,
      });
      return;
    }
    res.status(500).json({ message: "Server error adding completed day." });
  }
};

export const getCompletedDaysForMonth = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user.id; // Direct access
    const { month } = req.query; // Expecting month in 'YYYY-MM' format string

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: "Invalid user ID format." });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    if (!month || !/^\d{4}-\d{2}$/.test(month as string)) {
      res
        .status(400)
        .json({ message: "Invalid month format. Please use YYYY-MM." });
      return;
    }

    const [year, monthIndex] = (month as string).split("-").map(Number);
    const startDate = new Date(Date.UTC(year, monthIndex - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, monthIndex, 0, 23, 59, 59, 999));

    const completedDays = await CompletedDay.find({
      userId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ date: "asc" });

    const completedDayNumbers = completedDays.map((cd) =>
      new Date(cd.date).getUTCDate(),
    );

    res.status(200).json({ completedDayNumbers });
  } catch (error) {
    console.error("Error fetching completed days:", error);
    if (error instanceof Error) {
      res.status(500).json({
        message: "Server error fetching completed days.",
        error: error.message,
      });
      return;
    }
    res.status(500).json({ message: "Server error fetching completed days." });
  }
};

export const incrementStreak = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: "Invalid user ID format." });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const todayUtcMidnight = getTodayUtcMidnight();

    // Atomic upsert keeps repeated calls idempotent even under concurrency.
    const upsertResult = await CompletedDay.updateOne(
      { userId, date: todayUtcMidnight },
      {
        $setOnInsert: {
          userId,
          date: todayUtcMidnight,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    const alreadyCompleted = upsertResult.upsertedCount === 0;

    // Always recompute: another path (e.g. POST /streak/completed-days) may have
    // inserted today's entry without syncing user.streak. `alreadyCompleted` is
    // informational only, and recomputation is idempotent.
    const streakState = await recomputeAndPersistStreak(userId);
    if (!streakState) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    res.status(200).json({
      streak: streakState.streak,
      highestStreak: streakState.highestStreak,
      alreadyCompleted,
    });
  } catch (error) {
    console.error("Error incrementing streak:", error);
    if (error instanceof Error) {
      res.status(500).json({
        message: "Server error incrementing streak.",
        error: error.message,
      });
      return;
    }
    res.status(500).json({ message: "Server error incrementing streak." });
  }
};
