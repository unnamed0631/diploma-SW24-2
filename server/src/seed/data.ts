export interface SeedUser {
  key: string;
  username: string;
  email: string;
  password: string;
  gender: "male" | "female";
  age: number;
  height: number;
  weight: number;
  goal: string;
  activityLevel: string;
  mealPerDay: string;
  waterPerDay: string;
  workSchedule: string;
  healthCondition: string;
  bio: string;
  streak: number;
  highestStreak: number;
  totalCalories: number;
  role?: "USER" | "ADMIN";
  hasOnboarded?: boolean;
}

/**
 * Accounts created by `bun run seed`. Every account uses the same password so
 * the app can be tested against any persona.
 */
export const SEED_PASSWORD = "Test1234!";

export const SEED_USERS: SeedUser[] = [
  {
    key: "bat",
    username: "Bat-Erdene",
    email: "bat@bluvi.test",
    password: SEED_PASSWORD,
    gender: "male",
    age: 21,
    height: 178,
    weight: 74,
    goal: "build muscle",
    activityLevel: "active",
    mealPerDay: "4 meals",
    waterPerDay: "3l",
    workSchedule: "9-6 office",
    healthCondition: "healthy",
    bio: "Chasing a 100kg bench. Gym 5x a week.",
    streak: 12,
    highestStreak: 21,
    totalCalories: 182340,
  },
  {
    key: "saraa",
    username: "Saraa",
    email: "saraa@bluvi.test",
    password: SEED_PASSWORD,
    gender: "female",
    age: 24,
    height: 165,
    weight: 58,
    goal: "lose weight",
    activityLevel: "moderate",
    mealPerDay: "3 meals",
    waterPerDay: "2.5l",
    workSchedule: "shift work",
    healthCondition: "lactose intolerant",
    bio: "Yoga + running. Marathon in autumn 🏃‍♀️",
    streak: 5,
    highestStreak: 9,
    totalCalories: 96420,
  },
  {
    key: "tengis",
    username: "Tengis",
    email: "tengis@bluvi.test",
    password: SEED_PASSWORD,
    gender: "male",
    age: 27,
    height: 182,
    weight: 88,
    goal: "stay healthy",
    activityLevel: "sedentary",
    mealPerDay: "3 meals",
    waterPerDay: "2l",
    workSchedule: "remote dev",
    healthCondition: "lower back pain",
    bio: "Desk worker trying to undo eight hours of sitting.",
    streak: 0,
    highestStreak: 4,
    totalCalories: 42110,
  },
  {
    key: "admin",
    username: "Admin",
    email: "admin@bluvi.test",
    password: SEED_PASSWORD,
    gender: "female",
    age: 30,
    height: 170,
    weight: 63,
    goal: "maintain weight",
    activityLevel: "moderate",
    mealPerDay: "3 meals",
    waterPerDay: "2.5l",
    workSchedule: "flexible",
    healthCondition: "healthy",
    bio: "Bluvi caretaker account.",
    streak: 3,
    highestStreak: 6,
    totalCalories: 153000,
    role: "ADMIN",
    hasOnboarded: true,
  },
];

export interface SeedPost {
  authorKey: string;
  title: string;
  content: string;
  createdAt: string;
  views: number;
  likedBy: string[];
  comments: { authorKey: string; content: string; likedBy?: string[] }[];
}

export const SEED_POSTS: SeedPost[] = [
  {
    authorKey: "bat",
    title: "5x5 is boring but it works",
    content:
      "Ran the classic StrongLifts 5x5 for eight weeks. Squat went from 80kg to 105kg, bench is finally past 90kg. The trick was eating enough protein — around 150g per day — and actually sleeping eight hours instead of doom-scrolling until midnight.",
    createdAt: "2026-11-10T09:15:00.000Z",
    views: 132,
    likedBy: ["saraa", "tengis", "admin"],
    comments: [
      { authorKey: "tengis", content: "How do you hit 150g of protein? I struggle past 100g." },
      {
        authorKey: "bat",
        content:
          "Skyr for breakfast, chicken + rice at lunch, and a casein shake before bed. It's honestly just volume eating.",
        likedBy: ["tengis"],
      },
    ],
  },
  {
    authorKey: "saraa",
    title: "First 10k without walking",
    content:
      "Two months ago 3km felt impossible. Today I finished 10.2km at a 5:40/km average pace. What helped: the walk/run intervals from week one, running slow on purpose, and the streak calendar in this app keeping me honest.",
    createdAt: "2026-11-12T18:40:00.000Z",
    views: 87,
    likedBy: ["bat", "admin"],
    comments: [
      { authorKey: "admin", content: "Huge win! Are you following a specific plan?" },
      { authorKey: "saraa", content: "Mostly a couch-to-10k plan, three runs per week." },
    ],
  },
  {
    authorKey: "tengis",
    title: "Back pain: what actually helped",
    content:
      "Six weeks of: hip hinge drills, dead bugs, glute bridges and 10 minutes of walking after every meal. No heavy deadlifts for now. The biggest change was a standing desk and actually using it.",
    createdAt: "2026-11-13T08:05:00.000Z",
    views: 41,
    likedBy: ["bat"],
    comments: [],
  },
  {
    authorKey: "admin",
    title: "Meal prep for people who hate meal prep",
    content:
      "Cook one protein (2kg of chicken thighs), one carb (a big pot of rice), and roast two trays of vegetables on Sunday. Mix with different sauces each day and it never tastes like the same meal.",
    createdAt: "2026-11-07T12:00:00.000Z",
    views: 219,
    likedBy: ["bat", "saraa", "tengis"],
    comments: [
      { authorKey: "bat", content: "Sauce rotation is the secret nobody talks about." },
    ],
  },
  {
    authorKey: "saraa",
    title: "Sleep is a performance enhancer",
    content:
      "Swapped my 11pm phone habit for a book and my sleep score went from 62 to 84. Training feels easier and I'm not fighting cravings all afternoon.",
    createdAt: "2026-11-05T21:30:00.000Z",
    views: 64,
    likedBy: ["tengis"],
    comments: [],
  },
];

export const SEED_CHAT: { authorKey: string; messages: { role: "user" | "model"; content: string }[] }[] = [
  {
    authorKey: "bat",
    messages: [
      { role: "user", content: "How much protein should I eat to gain muscle?" },
      {
        role: "model",
        content:
          "Aim for roughly 1.6-2.2 g of protein per kg of body weight. At 74 kg that's about 120-160 g per day, split across 3-4 meals. Pair it with a small calorie surplus and progressive overload in the gym.",
      },
      { role: "user", content: "Is cardio going to ruin my gains?" },
      {
        role: "model",
        content:
          "No. Two or three 20-30 minute low-intensity sessions per week improve recovery and heart health without hurting muscle growth, as long as you eat enough to cover the extra energy cost.",
      },
    ],
  },
  {
    authorKey: "saraa",
    messages: [
      { role: "user", content: "What should I eat before a morning run?" },
      {
        role: "model",
        content:
          "For runs under an hour, a light snack 30-60 minutes before is enough: a banana with a spoon of peanut butter, or a small bowl of oats. If you run very early, a glass of water and half a banana works too.",
      },
    ],
  },
];
