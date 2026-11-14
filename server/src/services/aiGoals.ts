import { GoogleGenAI } from "@google/genai";
import { isAiConfigured } from "@/config/env";

const genAI = isAiConfigured()
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string })
  : null;

interface UserStats {
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  activityLevel?: string;
  healthConditions?: string[];
}

interface DailyGoals {
  waterGoal: number;
  stepsGoal: number;
  caloriesGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  sleepGoal: number;
  rdcGoal: number;
}

/**
 * Deterministic fallback (Mifflin-St Jeor + activity multiplier) so local dev
 * and AI outages still produce sensible goals without a Gemini key.
 */
function fallbackGoals(userStats: UserStats): DailyGoals {
  const weight =
    userStats.weight && userStats.weight > 0 ? userStats.weight : 70;
  const height =
    userStats.height && userStats.height > 0 ? userStats.height : 170;
  const age = userStats.age && userStats.age > 0 ? userStats.age : 30;
  const male = userStats.gender !== "female";

  const bmr = 10 * weight + 6.25 * height - 5 * age + (male ? 5 : -161);
  const activityMultiplier: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const calories = Math.round(
    bmr * (activityMultiplier[userStats.activityLevel ?? ""] ?? 1.375),
  );

  return {
    waterGoal:
      Math.round(Math.min(Math.max(weight * 35, 1500), 4000) / 100) * 100,
    stepsGoal: 8000,
    caloriesGoal: Math.min(Math.max(calories, 1200), 4000),
    proteinGoal: Math.round(weight * 1.6),
    carbsGoal: Math.round((calories * 0.45) / 4),
    fatGoal: Math.round((calories * 0.25) / 9),
    sleepGoal: 8,
    rdcGoal: 0,
  };
}

export async function generateDailyGoals(
  userStats: UserStats,
): Promise<DailyGoals> {
  if (!genAI) {
    return fallbackGoals(userStats);
  }

  try {
    const prompt = `As a health and fitness expert, please provide personalized daily goals for a user with the following characteristics:
    Age: ${userStats.age || "Not specified"}
    Weight: ${userStats.weight || "Not specified"} kg
    Height: ${userStats.height || "Not specified"} cm
    Gender: ${userStats.gender || "Not specified"}
    Activity Level: ${userStats.activityLevel || "Not specified"}
    Health Conditions: ${
      userStats.healthConditions?.join(", ") || "None specified"
    }

    Please provide specific numerical values for:
    1. Daily water intake (in ml)
    2. Daily steps target
    3. Daily calorie target
    4. Daily protein target (in g)
    5. Daily carbs target (in g)
    6. Daily fat target (in g)
    7. Daily sleep target (in hours)
    8. Daily recommended calorie deficit/surplus (in calories)

    Format the response as a JSON object with these exact keys:
    {
      "waterGoal": number,
      "stepsGoal": number,
      "caloriesGoal": number,
      "proteinGoal": number,
      "carbsGoal": number,
      "fatGoal": number,
      "sleepGoal": number,
      "rdcGoal": number
    }`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    const text = result.text ?? "";

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const goals: DailyGoals = JSON.parse(jsonMatch[0]);

    // Validate and sanitize the values
    return {
      waterGoal: Math.max(1500, Math.min(5000, goals.waterGoal)),
      stepsGoal: Math.max(5000, Math.min(20000, goals.stepsGoal)),
      caloriesGoal: Math.max(1200, Math.min(4000, goals.caloriesGoal)),
      proteinGoal: Math.max(30, Math.min(300, goals.proteinGoal)),
      carbsGoal: Math.max(100, Math.min(500, goals.carbsGoal)),
      fatGoal: Math.max(20, Math.min(200, goals.fatGoal)),
      sleepGoal: Math.max(6, Math.min(10, goals.sleepGoal)),
      rdcGoal: Math.max(-1000, Math.min(1000, goals.rdcGoal)),
    };
  } catch (error) {
    console.error("Error generating daily goals:", error);
    return fallbackGoals(userStats);
  }
}
