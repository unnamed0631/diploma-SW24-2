import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

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

if (!process.env.FIREBASE_STORAGE_BUCKET) {
  throw new Error("FIREBASE_STORAGE_BUCKET environment variable is not set");
}

const serviceAccount = loadServiceAccount();

let app;
try {
  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw error;
}

export const bucket = getStorage(app).bucket();
export default app;
