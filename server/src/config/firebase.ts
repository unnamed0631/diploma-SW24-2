import {
  cert,
  getApps,
  initializeApp,
  type ServiceAccount,
} from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { isFirebaseConfigured } from "@/config/env";

function loadServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set");
  }

  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    // Fall through to try base64-encoded JSON.
  }

  try {
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(decoded) as ServiceAccount;
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT must be a JSON string (or base64-encoded JSON) of a Firebase service account",
    );
  }
}

let app: ReturnType<typeof initializeApp> | null = null;

function getFirebaseApp() {
  if (app) return app;

  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured: set FIREBASE_SERVICE_ACCOUNT and FIREBASE_STORAGE_BUCKET",
    );
  }

  const existing = getApps()[0];
  app =
    existing ??
    initializeApp({
      credential: cert(loadServiceAccount()),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

  return app;
}

export const getBucket = () =>
  getStorage(getFirebaseApp()).bucket(process.env.FIREBASE_STORAGE_BUCKET);
