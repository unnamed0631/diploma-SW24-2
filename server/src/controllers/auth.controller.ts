import { Request, Response } from "express";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import mongoose from "mongoose";
import User, { IUser } from "@/models/user";
import {
  AuthenticatedRequest,
  generateAccessToken,
  generateRefreshToken,
  UserPayload,
} from "./token";
import { transporter } from "@/services/nodemailer";
import RefreshToken from "@/models/refreshToken";
import axios from "axios";
import { BASE_URL } from "@/routes/constants";
import { APP_SCHEME } from "@/routes/constants";
import { randomUUID } from "crypto";
import { uploadProfileImage } from "@/helpers/uploadImage";
import { redisService } from "@/services/redis";
import DailyGoal from "@/models/dailyGoal";
import { generateDailyGoals } from "@/services/aiGoals";
import genFoodPlan from "@/services/aiFood";
import analyzeFoodImage from "@/services/aiFoodImage";
import genExercisePlan from "@/services/aiExercisePlan";
import { isMailConfigured } from "@/config/env";

const { genSaltSync, hashSync, compareSync } = bcryptjs;
const hashRounds = 10;

// Google-only accounts get a random password hash: they authenticate through
// Google and can set a real password later via /auth/update.
const generateOAuthPlaceholderPassword = () =>
  hashSync(randomUUID(), genSaltSync(hashRounds));

// Fields a client may change through PUT /auth/update. Anything not listed here
// is ignored, except protected fields which are rejected outright below.
const EDITABLE_USER_FIELDS = [
  "username",
  "image",
  "bio",
  "gender",
  "birthday",
  "height",
  "weight",
  "goal",
  "activityLevel",
  "mealPerDay",
  "waterPerDay",
  "workSchedule",
  "healthCondition",
  "hasOnboarded",
] as const;

const EDITABLE_USER_FIELD_SET = new Set<string>(EDITABLE_USER_FIELDS);

const NUMERIC_USER_FIELDS = new Set(["height", "weight"]);

// Server-owned or security-sensitive fields. Clients can never set these
// directly: streaks are computed server-side and role/verification/posts/email
// have dedicated flows.
const PROTECTED_USER_FIELDS = new Set([
  "streak",
  "highestStreak",
  "totalCalories",
  "lastStreakUpdate",
  "role",
  "isEmailVerified",
  "password",
  "posts",
  "email",
  "stats",
  "_id",
  "id",
  "emailVerificationToken",
  "emailVerificationTokenExpiry",
  "createdAt",
  "updatedAt",
]);

type EditableFieldResult =
  { ok: true; value: unknown } | { ok: false; error: string };

function validateEditableField(key: string, raw: unknown): EditableFieldResult {
  if (NUMERIC_USER_FIELDS.has(key)) {
    // multipart/form-data delivers numbers as strings, so coerce those too.
    const value =
      typeof raw === "number"
        ? raw
        : typeof raw === "string" && raw.trim() !== ""
          ? Number(raw)
          : NaN;
    if (!Number.isFinite(value)) {
      return { ok: false, error: "must be a finite number" };
    }
    return { ok: true, value };
  }

  if (key === "birthday") {
    const value =
      raw instanceof Date
        ? raw
        : typeof raw === "string"
          ? new Date(raw)
          : null;
    if (!value || Number.isNaN(value.getTime())) {
      return { ok: false, error: "must be a valid date" };
    }
    return { ok: true, value };
  }

  if (key === "hasOnboarded") {
    if (typeof raw === "boolean") return { ok: true, value: raw };
    if (raw === "true") return { ok: true, value: true };
    if (raw === "false") return { ok: true, value: false };
    return { ok: false, error: "must be a boolean" };
  }

  if (typeof raw !== "string") {
    return { ok: false, error: "must be a string" };
  }
  return { ok: true, value: raw };
}

async function updateUserGoals(user: IUser) {
  try {
    let dailyGoal = await DailyGoal.findOne({ userId: user._id });

    if (!dailyGoal) {
      dailyGoal = new DailyGoal({ userId: user._id });
    }

    if (dailyGoal.needsUpdate()) {
      const newGoals = await generateDailyGoals({
        age: user.birthday
          ? Math.floor(
              (Date.now() - new Date(user.birthday).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000),
            )
          : undefined,
        weight: user.weight,
        height: user.height,
        gender: user.gender,
        activityLevel: user.activityLevel,
        healthConditions: user.healthCondition
          ? [user.healthCondition]
          : undefined,
      });

      Object.assign(dailyGoal, newGoals);
      await dailyGoal.save();
    }

    return dailyGoal.toJSON();
  } catch (error) {
    console.error("Error updating user goals:", error);
    return null;
  }
}

class AuthController {
  public static async login(req: Request, res: Response): Promise<any> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

      if (token) {
        const decoded = jwt.verify(
          token,
          process.env.SECRET_ACCESS_TOKEN as string,
        ) as UserPayload;

        if (!decoded) {
          return res.status(403).json({ message: "Invalid token" });
        }

        // redis get
        const redisUser = await redisService.get(`user:${decoded.id}`);

        if (redisUser) {
          const parsedUser = JSON.parse(redisUser);
          const accessToken = generateAccessToken(parsedUser);
          const refreshToken = await generateRefreshToken(parsedUser);
          return res.status(200).json({
            message: "User logged in successfully with token",
            user: parsedUser,
            accessToken,
            refreshToken,
          });
        }

        const user = await User.findById(decoded.id).select([
          "-password",
          "-emailVerificationToken",
        ]);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const dailyGoal = await updateUserGoals(user);
        const userData = {
          ...user.toJSON(),
          dailyGoals: dailyGoal,
        };

        await redisService.set(`user:${user._id}`, JSON.stringify(userData));

        const accessToken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);

        return res.json({
          message: "User logged in successfully with token",
          user: userData,
          accessToken,
          refreshToken,
        });
      }

      const { password, email } = req?.body;
      if (!password || !email)
        return res.status(400).json({ message: "Missing password or email" });

      const user = await User.findOne({ email: email.toLowerCase() })
        .select("-emailVerificationToken")
        .exec();
      if (!user) return res.status(404).json({ message: "User not found" });

      const match = compareSync(password, user.password);
      if (!match)
        return res.status(401).json({ message: "Password does not match" });

      const dailyGoal = await updateUserGoals(user);
      const userData = {
        ...user.toJSON(),
        dailyGoals: dailyGoal,
      };

      if ("password" in userData) {
        delete (userData as { password?: string }).password;
      }

      await redisService.set(`user:${user._id}`, JSON.stringify(userData));

      const accessToken = generateAccessToken(user);
      const refreshToken = await generateRefreshToken(user);

      res.json({
        message: "User logged in successfully",
        user: userData,
        accessToken,
        refreshToken,
      });
    } catch (e) {
      console.error("login error:", e);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  public static async register(req: Request, res: Response): Promise<any> {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingUser = await User.findOne({ email })
        .session(session)
        .exec();
      if (existingUser) {
        await session.abortTransaction();
        return res.status(400).json({ message: "User already exists" });
      }

      const salt = genSaltSync(hashRounds);
      const hashedPassword = hashSync(password, salt);

      const newUser = (
        await User.create([{ ...req.body, password: hashedPassword }], {
          session,
        })
      )[0];

      const accessToken = generateAccessToken(newUser);
      const refreshToken = await generateRefreshToken(newUser);
      const dailyGoal = await updateUserGoals(newUser);

      await session.commitTransaction();

      const userObj: Record<string, unknown> = { ...newUser.toJSON() };
      userObj.dailyGoals = dailyGoal;
      delete userObj.password;

      res.status(201).json({
        message: "User registered successfully",
        user: userObj,
        accessToken,
        refreshToken,
      });
    } catch (e) {
      await session.abortTransaction();
      console.error("register error:", e);
      res.status(500).json({ message: "Internal Server Error" });
    } finally {
      session.endSession();
    }
  }

  public static async update(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<any> {
    if ((!req.body || Object.keys(req.body).length === 0) && !req.file) {
      return res.status(400).json({ message: "Request is empty" });
    }

    const { password, newPassword, ...otherBodyFields } = req.body;
    const image = req.file;

    const attemptsPasswordChange = Boolean(password || newPassword);
    if (attemptsPasswordChange && !(password && newPassword)) {
      return res.status(400).json({
        message:
          "Both the current password and newPassword are required to change the password",
      });
    }

    const protectedFields = Object.keys(otherBodyFields).filter((key) =>
      PROTECTED_USER_FIELDS.has(key),
    );
    if (protectedFields.length > 0) {
      return res.status(400).json({
        message: `These fields cannot be updated directly: ${protectedFields.join(
          ", ",
        )}`,
      });
    }

    const updateData: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(otherBodyFields)) {
      // Unknown fields are ignored rather than rejected.
      if (!EDITABLE_USER_FIELD_SET.has(key)) continue;
      const result = validateEditableField(key, raw);
      if (!result.ok) {
        return res
          .status(400)
          .json({ message: `Invalid value for "${key}": ${result.error}` });
      }
      updateData[key] = result.value;
    }

    let willUpdatePassword = false;
    let hashedPassword;
    try {
      const user = await User.findById(req.user.id).exec();
      if (!user) return res.status(404).json({ message: "User not found" });

      if (newPassword && password) {
        const match = compareSync(password, user.password);
        if (!match)
          return res.status(401).json({ message: "Passwords don't match" });
        if (newPassword === password)
          return res.status(400).json({
            message: "New password cannot be the same as the old password",
          });
        willUpdatePassword = true;
        const salt = genSaltSync(hashRounds);
        hashedPassword = hashSync(newPassword, salt);
      }

      if (image) {
        updateData.image = await uploadProfileImage(image, user);
      }

      if (willUpdatePassword) {
        updateData.password = hashedPassword;
      }

      const newUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true },
      )
        .select("-password -emailVerificationToken")
        .exec();

      if (!newUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Keep the cached user consistent with login responses (dailyGoals included).
      const dailyGoal = await updateUserGoals(newUser);

      const accessToken = generateAccessToken(newUser!);
      const refreshToken = await generateRefreshToken(newUser!);

      return res.status(200).json({
        message: "User updated successfully",
        user: { ...newUser.toJSON(), dailyGoals: dailyGoal },
        accessToken,
        refreshToken,
      });
    } catch (e) {
      console.error("update error:", e);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  public static async logout(req: Request, res: Response): Promise<any> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : req.cookies?.refreshToken || req.body?.refreshToken || null;

      if (!token) {
        return res.status(400).json({ message: "No token provided" });
      }

      return jwt.verify(
        token,
        process.env.SECRET_REFRESH_TOKEN as string,
        async (err: Error | null, decoded: any) => {
          if (err) {
            return res.status(403).json({ message: "Invalid token" });
          }

          await User.findByIdAndUpdate(decoded.id, { token: null }).exec();
          await RefreshToken.deleteMany({ userId: decoded.id }).exec();

          res.clearCookie("refreshToken", {
            httpOnly: true,
            sameSite: "none",
            secure: true,
          });

          res.status(200).json({ message: "User logged out successfully" });
        },
      );
    } catch (e) {
      console.error("logout error:", e);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  public static async generateNewToken(
    req: Request,
    res: Response,
  ): Promise<any> {
    try {
      let refreshToken = null;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        refreshToken = authHeader.slice(7);
      } else if (req.cookies?.refreshToken || req.body?.refreshToken) {
        refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      }

      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
      }

      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.SECRET_REFRESH_TOKEN as string,
        ) as UserPayload;

        if (!decoded) {
          return res.status(403).json({ message: "Invalid refresh token" });
        }

        // Try to get user from Redis first
        const redisUser = await redisService.get(`user:${decoded.id}`);
        if (redisUser) {
          const parsedUser = JSON.parse(redisUser);
          const accessToken = generateAccessToken(parsedUser);
          const newRefreshToken = await generateRefreshToken(parsedUser);

          return res.json({
            message: "Tokens generated successfully",
            user: parsedUser,
            accessToken,
            refreshToken: newRefreshToken,
          });
        }

        // If not in Redis, get from DB
        const user = await User.findById(decoded.id)
          .select("-password -emailVerificationToken")
          .exec();

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const dailyGoal = await updateUserGoals(user);
        const userData = {
          ...user.toJSON(),
          dailyGoals: dailyGoal,
        };

        await redisService.set(`user:${user._id}`, JSON.stringify(userData));

        const accessToken = generateAccessToken(user);
        const newRefreshToken = await generateRefreshToken(user);

        return res.json({
          message: "Tokens generated successfully",
          user: userData,
          accessToken,
          refreshToken: newRefreshToken,
        });
      } catch (jwtError) {
        console.error("JWT verification error:", jwtError);
        return res.status(403).json({ message: "Invalid refresh token" });
      }
    } catch (e) {
      console.error("generateNewToken error:", e);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  public static async sendVerificationEmail(
    req: Request,
    res: Response,
  ): Promise<any> {
    const { email } = req.body;

    if (!isMailConfigured()) {
      return res.status(503).json({
        message:
          "Email delivery is disabled on this server (SMTP_USER / SMTP_PASS not set).",
      });
    }

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const secret = process.env.EMAIL_VERIFICATION_SECRET;
      if (!secret) {
        return res.status(503).json({
          message:
            "Email verification is disabled (EMAIL_VERIFICATION_SECRET not set).",
        });
      }

      const token = jwt.sign({ id: user._id }, secret, { expiresIn: "1h" });

      const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

      user.emailVerificationToken = token;
      user.emailVerificationTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
      await user.save();

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: user.email,
        subject: "Email Verification",
        html: `<p>Please click on the link below to verify your email:</p>
               <a href="${verificationUrl}">Verify Email</a>`,
      };

      transporter.sendMail(mailOptions, (error, _info) => {
        if (error) {
          return res.status(500).json({ message: "Error sending email" });
        }
        res.status(200).json({ message: "Verification email sent" });
      });
    } catch (e) {
      console.error("Error sending verification email:", e);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  public static async verifyEmail(req: Request, res: Response): Promise<any> {
    const { token } = req.query;

    try {
      const secret = process.env.EMAIL_VERIFICATION_SECRET;
      if (!secret) {
        return res.status(503).json({
          message:
            "Email verification is disabled (EMAIL_VERIFICATION_SECRET not set).",
        });
      }

      const decoded = jwt.verify(token as string, secret) as UserPayload;

      const user = await User.findById(decoded.id).select("-password").exec();
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Check token expiry
      if (
        user.emailVerificationTokenExpiry &&
        user.emailVerificationTokenExpiry < new Date()
      ) {
        return res.status(400).json({ message: "Token expired" });
      }

      // Set user as verified
      user.isEmailVerified = true;
      user.emailVerificationToken = "";
      user.emailVerificationTokenExpiry = new Date();
      await user.save();

      res.status(200).json({ message: "Email verified successfully" });
    } catch (e) {
      console.error("Error verifying email:", e);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  public static async google(req: Request, res: Response): Promise<any> {
    const { code } = req.body;
    try {
      const response = await axios.post(
        "https://oauth2.googleapis.com/token",
        new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID as string,
          client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
          redirect_uri: `${BASE_URL}/auth/callback`,
          grant_type: "authorization_code",
          code: code,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
      );
      const data = response.data;
      const decodeResult = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${data.id_token}`,
        { method: "GET" },
      );
      if (!decodeResult.ok) {
        return res.status(401).json({ message: "Google token is invalid" });
      }
      const userInfo = (await decodeResult.json()) as googleUser;
      console.log("Google user:", userInfo.email);

      let user = await User.findOne({ email: userInfo.email })
        .select("-password -emailVerificationToken")
        .exec();

      // First Google sign-in: create the account immediately instead of asking
      // the client to complete a separate registration flow (Apple parity).
      if (!user) {
        const created = await User.create({
          email: userInfo.email,
          username: userInfo.name || userInfo.email.split("@")[0],
          image: userInfo.picture ?? null,
          password: generateOAuthPlaceholderPassword(),
          isEmailVerified: true,
          hasOnboarded: false,
        });
        user = await User.findById(created._id)
          .select("-password -emailVerificationToken")
          .exec();
      }

      if (!user) {
        return res.status(500).json({ message: "Could not load user" });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = await generateRefreshToken(user);
      const dailyGoal = await updateUserGoals(user);

      const userData = {
        ...user.toJSON(),
        dailyGoals: dailyGoal,
      };
      await redisService.set(`user:${user._id}`, JSON.stringify(userData));

      res.status(200).json({
        user: userData,
        accessToken,
        refreshToken,
      });
    } catch (e) {
      console.error("Error verifying email:", e);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  public static async authorize(req: Request, res: Response): Promise<any> {
    const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    try {
      if (!process.env.GOOGLE_CLIENT_ID) {
        return res
          .status(500)
          .json({ error: "Missing GOOGLE_CLIENT_ID environment variable" });
      }

      const url = new URL(
        req.protocol + "://" + req.get("host") + req.originalUrl,
      );
      let idpClientId: string;

      const internalClient = url.searchParams.get("client_id");
      const redirectUri = url.searchParams.get("redirect_uri");
      let platform;

      if (redirectUri === APP_SCHEME) {
        platform = "mobile";
      } else if (redirectUri === BASE_URL) {
        platform = "web";
      } else {
        return res.status(400).json({ error: "Invalid redirect_uri" });
      }

      let state = platform + "|" + url.searchParams.get("state");

      if (internalClient === "google") {
        idpClientId = process.env.GOOGLE_CLIENT_ID;
      } else {
        return res.status(400).json({ error: "Invalid client" });
      }

      if (!state) {
        return res.status(400).json({ error: "Invalid state" });
      }

      const params = new URLSearchParams({
        client_id: idpClientId,
        redirect_uri: `${BASE_URL}/auth/callback`,
        response_type: "code",
        scope: "openid email profile",
        state: state,
        prompt: "select_account",
      });

      return res.redirect(GOOGLE_AUTH_URL + "?" + params.toString());
    } catch (e) {
      console.error("authorize error:", e);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  public static async callback(req: Request, res: Response): Promise<any> {
    const incomingParams = new URLSearchParams(req.url.split("?")[1]);
    const combinedPlatformAndState = incomingParams.get("state");
    if (!combinedPlatformAndState) {
      return res.status(400).json({ error: "Invalid state" });
    }
    const state = combinedPlatformAndState.split("|")[1];

    const outgoingParams = new URLSearchParams({
      code: incomingParams.get("code")?.toString() || "",
      state,
    });

    return res.redirect(
      APP_SCHEME + "/(auth)/signup" + "?" + outgoingParams.toString(),
    );
  }

  public static async food(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<any> {
    let user = null;
    let goal = null;
    const redisUser = await redisService.get(`user:${req.user.id}`);
    if (redisUser) {
      user = JSON.parse(redisUser);
    } else {
      user = await User.findById(req.user.id)
        .select("weight height gender activityLevel healthCondition goal")
        .exec();
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      goal = await DailyGoal.findOne({
        userId: req.user.id,
      }).exec();
      if (!goal) {
        return res.status(404).json({ message: "User goals not found" });
      }
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const foodPlan = await genFoodPlan(user, goal);

    if (!foodPlan) {
      return res
        .status(500)
        .json({ message: "Failed to generate a food plan" });
    }

    return res.status(200).json(foodPlan);
  }

  public static async foodImage(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<any> {
    const image = req.file;
    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }
    // turn img multer memory to base64
    const base64Image = image.buffer.toString("base64");
    try {
      const food = await analyzeFoodImage(base64Image);
      return res.status(200).json(food);
    } catch (e) {
      if (e instanceof Error && e.name === "AiUnavailableError") {
        return res.status(503).json({ message: e.message });
      }
      throw e;
    }
  }

  public static async exercise(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<any> {
    try {
      const user = await User.findById(req.user.id)
        .select("weight height gender activityLevel healthCondition goal")
        .exec();

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const exercisePlan = await genExercisePlan(user);
      return res.status(200).json(exercisePlan);
    } catch (e) {
      if (e instanceof Error && e.name === "AiUnavailableError") {
        return res.status(503).json({ message: e.message });
      }
      console.error("Error generating exercise plan:", e);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default AuthController;

type googleUser = {
  email: string;
  given_name: string;
  family_name: string;
  picture: string;
  name: string;
};
