import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import fs from "fs";
import User, { Gender, Role } from "@/models/user";
import Post from "@/models/post";
import Comment from "@/models/comment";
import CompletedDay from "@/models/CompletedDay";
import DailyGoal from "@/models/dailyGoal";
import Chat from "@/models/chatbotHistory";
import RefreshToken from "@/models/refreshToken";
import connectToMongoDB from "@/services/mongodb";
import { generateDailyGoals } from "@/services/aiGoals";
import {
  SEED_USERS,
  SEED_POSTS,
  SEED_CHAT,
  SEED_PASSWORD,
  type SeedUser,
} from "@/seed/data";
import { baseUrl, clearLocalUploads, localImage } from "@/seed/localStorage";

const exercises: {
  id: number;
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  repetitions?: number;
  sets?: number;
  equipment: string;
  level: string;
  video?: string;
}[] = JSON.parse(fs.readFileSync("./src/services/exercises.json", "utf8"));

const DAY_MS = 24 * 60 * 60 * 1000;
const STREAK_WINDOW_DAYS = 130;

const isoDay = (date: Date) => date.toISOString().slice(0, 10);
const utcMidnight = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

function lastNDays(n: number): string[] {
  const today = utcMidnight(new Date());
  return Array.from({ length: n }, (_, i) =>
    isoDay(new Date(today.getTime() - i * DAY_MS)),
  );
}

const streakWindow = lastNDays(STREAK_WINDOW_DAYS);

/** lastNDays but oldest-first, with today last. */
function ascendingDays(n: number): string[] {
  return lastNDays(n).reverse();
}

/**
 * Completed-day sets that make the seeded streaks/achievements believable:
 * `current` consecutive days ending today, plus a `best` run further in the
 * past. Stable (date based) so re-running the seed is idempotent.
 */
function completedDatesFor(user: SeedUser): string[] {
  const current = lastNDays(user.streak);
  const sets = new Set(current);

  if (user.highestStreak > user.streak) {
    // Older best streak, separated from the current one by a few empty days so
    // marking a single missed day cannot accidentally bridge the two runs.
    const GAP_DAYS = 4;
    for (let i = 0; i < user.highestStreak; i++) {
      const idx = current.length + GAP_DAYS + i;
      if (idx >= STREAK_WINDOW_DAYS) break;
      sets.add(streakWindow[idx]);
    }
  }

  return [...sets].sort();
}

const pick = <T>(arr: T[], n: number, offset: number): T[] => {
  const start = offset % arr.length;
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    out.push(arr[(start + i * 7) % arr.length]);
  }
  return out;
};

function workoutPlanFor(user: SeedUser) {
  return pick(exercises, 4, user.username.length).map((exercise) => ({
    ...exercise,
    video: exercise.video ?? "https://www.youtube.com/watch?v=ml6cT4AZdqI",
  }));
}

const foodPlanFor = () => ({
  breakfast: {
    food_name: "Oatmeal with Banana",
    protein: 12,
    fat: 8,
    carbs: 55,
    calories: 342,
    image: `${baseUrl()}/uploads/blogs/seed-oatmeal.png`,
  },
  lunch: {
    food_name: "Chicken Salad",
    protein: 38,
    fat: 14,
    carbs: 22,
    calories: 410,
    image: `${baseUrl()}/uploads/blogs/seed-chicken-salad.png`,
  },
  dinner: {
    food_name: "Grilled Salmon with Rice",
    protein: 35,
    fat: 18,
    carbs: 48,
    calories: 520,
    image: `${baseUrl()}/uploads/blogs/seed-salmon.png`,
  },
  snack: {
    food_name: "Greek Yogurt with Berries",
    protein: 15,
    fat: 4,
    carbs: 18,
    calories: 160,
    image: `${baseUrl()}/uploads/blogs/seed-yogurt.png`,
  },
});

async function resetDatabase() {
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    CompletedDay.deleteMany({}),
    DailyGoal.deleteMany({}),
    Chat.deleteMany({}),
    RefreshToken.deleteMany({}),
  ]);
  console.log("🧹 Cleared collections");
}

async function seedUsers(): Promise<
  Record<string, mongoose.HydratedDocument<any>>
> {
  const passwordHash = bcryptjs.hashSync(SEED_PASSWORD, 10);
  const users: Record<string, mongoose.HydratedDocument<any>> = {};

  for (const seed of SEED_USERS) {
    const birthday = new Date();
    birthday.setFullYear(birthday.getFullYear() - seed.age);
    birthday.setMonth(0, 15);
    birthday.setMilliseconds(0);

    const image = await localImage("users", `seed-${seed.key}`);

    const created = await User.create({
      username: seed.username,
      email: seed.email,
      password: passwordHash,
      gender: seed.gender === "male" ? Gender.MALE : Gender.FEMALE,
      birthday,
      height: seed.height,
      weight: seed.weight,
      goal: seed.goal,
      activityLevel: seed.activityLevel,
      mealPerDay: seed.mealPerDay,
      waterPerDay: seed.waterPerDay,
      workSchedule: seed.workSchedule,
      healthCondition: seed.healthCondition,
      bio: seed.bio,
      streak: seed.streak,
      highestStreak: seed.highestStreak,
      totalCalories: seed.totalCalories,
      lastStreakUpdate: seed.streak > 0 ? new Date() : undefined,
      role: seed.role === "ADMIN" ? Role.ADMIN : Role.USER,
      hasOnboarded: seed.hasOnboarded ?? true,
      isEmailVerified: true,
      image,
    });

    users[seed.key] = created;

    await User.updateOne(
      { _id: users[seed.key]._id },
      { $unset: { stats: 1 } },
    );

    console.log(`👤 ${seed.username} <${seed.email}>`);
  }

  return users;
}

async function seedGoals(users: Record<string, any>) {
  for (const seed of SEED_USERS) {
    const user = users[seed.key];
    const goals = await generateDailyGoals({
      age: seed.age,
      weight: seed.weight,
      height: seed.height,
      gender: seed.gender,
      activityLevel: seed.activityLevel,
      healthConditions: [seed.healthCondition],
    });

    const workout = workoutPlanFor(seed);
    await DailyGoal.create({
      userId: user._id,
      ...goals,
    });

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          stats: {
            dailyGoals: goals,
            workouts: workout,
            dailyFoods: foodPlanFor(),
          },
        },
      },
    );
  }

  // local food images
  for (const name of ["oatmeal", "chicken-salad", "salmon", "yogurt"]) {
    await localImage("blogs", `seed-${name}`);
  }
  console.log(`🎯 Daily goals + plans for ${SEED_USERS.length} users`);
}

async function seedCompletedDays(users: Record<string, any>) {
  let total = 0;

  for (const seed of SEED_USERS) {
    const dates = completedDatesFor(seed);
    if (dates.length === 0) continue;

    await CompletedDay.insertMany(
      dates.map((date) => ({
        userId: users[seed.key]._id,
        date: new Date(`${date}T00:00:00.000Z`),
        createdAt: new Date(`${date}T09:00:00.000Z`),
      })),
    );
    total += dates.length;
  }

  console.log(`🔥 ${total} completed days (streaks)`);
}

async function seedPosts(users: Record<string, any>) {
  const postIndex = await localImage("blogs", "seed-post-default");
  void postIndex;

  for (const [i, seed] of SEED_POSTS.entries()) {
    const image = await localImage("blogs", `seed-post-${i + 1}`);
    const likes = seed.likedBy
      .map((key) => users[key]?._id)
      .filter(Boolean) as mongoose.Types.ObjectId[];

    const post = await Post.create({
      title: seed.title,
      content: seed.content,
      description: seed.content.slice(0, 120),
      image,
      author: users[seed.authorKey]._id,
      likes,
      views: seed.views,
      createdAt: new Date(seed.createdAt),
      updatedAt: new Date(seed.createdAt),
    });

    const commentIds: mongoose.Types.ObjectId[] = [];
    for (const [j, c] of seed.comments.entries()) {
      const comment = await Comment.create({
        content: c.content,
        author: users[c.authorKey]._id,
        blogId: post._id,
        likes: (c.likedBy ?? []).map((key) => users[key]?._id).filter(Boolean),
        createdAt: new Date(
          new Date(seed.createdAt).getTime() + (j + 1) * 60000,
        ),
      });
      commentIds.push(comment._id);
    }

    await Post.updateOne({ _id: post._id }, { $set: { comments: commentIds } });
    await User.updateOne(
      { _id: users[seed.authorKey]._id },
      { $push: { posts: post._id } },
    );
  }

  console.log(`📝 ${SEED_POSTS.length} posts with comments`);
}

async function seedChats(users: Record<string, any>) {
  const systemPrompt =
    "You are a knowledgeable assistant focused entirely on fitness and health.";

  for (const chat of SEED_CHAT) {
    await Chat.create({
      userId: users[chat.authorKey]._id.toString(),
      messages: [
        { role: "system", content: systemPrompt, timestamp: new Date() },
        ...chat.messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(),
        })),
      ],
    });
  }

  console.log(`💬 ${SEED_CHAT.length} chatbot conversations`);
}

async function main() {
  const started = Date.now();
  await connectToMongoDB();

  await resetDatabase();
  await clearLocalUploads();

  const users = await seedUsers();
  await seedGoals(users);
  await seedCompletedDays(users);
  await seedPosts(users);
  await seedChats(users);

  const days = ascendingDays(10);
  const today = days[days.length - 1];
  const oldest = days[0];

  console.log(
    "\n✅ Seed complete in",
    ((Date.now() - started) / 1000).toFixed(1),
    "s",
  );
  console.log(`\nLogin with any of these (password: ${SEED_PASSWORD}):`);
  for (const seed of SEED_USERS) {
    console.log(
      `  ${seed.email.padEnd(22)} ${seed.username} (streak ${seed.streak})`,
    );
  }
  console.log(`\nRecent days for the streak API: ${oldest} ... ${today}`);
  console.log(
    `   POST ${baseUrl()}/streak/completed-days { "date": "${today}" }`,
  );
  console.log(
    `   GET  ${baseUrl()}/streak/completed-days?month=${today.slice(0, 7)}`,
  );

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (error) => {
  console.error("❌ Seed failed:", error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
