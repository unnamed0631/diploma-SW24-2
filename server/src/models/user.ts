import mongoose, { Schema, Model } from "mongoose";

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
}

export interface IUser {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  stats?: Record<string, any>;
  gender: Gender;
  birthday: Date;
  height: number;
  weight: number;
  goal: string;
  activityLevel: string;
  mealPerDay: string;
  waterPerDay: string;
  workSchedule: string;
  healthCondition: string;
  password: string;
  role: Role;
  bio?: string;
  image?: string | null;
  posts?: mongoose.Types.ObjectId[];
  isEmailVerified: boolean;
  hasOnboarded: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  streak?: number;
  highestStreak?: number;
  totalCalories?: number;
  lastStreakUpdate?: Date;
}

// Define the schema
const userSchema: Schema<IUser> = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    stats: {
      type: Schema.Types.Mixed,
      required: false,
    },
    // Onboarding fields are only known after the register wizard, so the OAuth
    // flow creates the account with an email/password and fills them later.
    gender: {
      type: String,
      enum: Object.values(Gender),
      required: false,
      default: Gender.MALE,
    },
    birthday: {
      type: Date,
      required: false,
      default: Date.now,
    },
    height: {
      type: Number,
      required: false,
      default: 0,
    },
    weight: {
      type: Number,
      required: false,
      default: 0,
    },
    goal: {
      type: String,
      required: false,
      default: "maintain weight",
    },
    activityLevel: {
      type: String,
      required: false,
      default: "moderate",
    },
    mealPerDay: {
      type: String,
      required: false,
      default: "3 meals",
    },
    waterPerDay: {
      type: String,
      required: false,
      default: "2l",
    },
    workSchedule: {
      type: String,
      required: false,
      default: "regular",
    },
    healthCondition: {
      type: String,
      required: false,
      default: "healthy",
    },
    streak: {
      type: Number,
      required: false,
      default: 0,
    },
    highestStreak: {
      type: Number,
      required: false,
      default: 0,
    },
    totalCalories: {
      type: Number,
      required: false,
      default: 0,
    },
    lastStreakUpdate: {
      type: Date,
      required: false,
      default: undefined,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
      required: true,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "Hello this is my Bio",
    },
    image: {
      type: String,
      default: null,
      required: false,
    },
    posts: {
      type: [Schema.Types.ObjectId],
      ref: "Post",
      required: false,
      default: [],
    },
    isEmailVerified: { type: Boolean, default: false, required: false },
    hasOnboarded: { type: Boolean, default: false, required: false },
    emailVerificationToken: { type: String, required: false, default: null },
    emailVerificationTokenExpiry: {
      type: Date,
      required: false,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ email: 1 }, { unique: true });

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;
