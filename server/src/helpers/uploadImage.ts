import { getBucket } from "@/config/firebase";
import { isFirebaseConfigured } from "@/config/env";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const ensureStorage = () => {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase storage is not configured (FIREBASE_SERVICE_ACCOUNT / FIREBASE_STORAGE_BUCKET)",
    );
  }
};

const bucketName = () => process.env.FIREBASE_STORAGE_BUCKET;

const uploadsDir = (folder: string) =>
  path.join(process.cwd(), "public", "uploads", folder);

/**
 * Dev fallback used when Firebase credentials are missing: keeps the uploaded
 * image under `public/uploads` so it is served by `express.static` and the
 * returned URL still works inside the app. Throws in production.
 */
const saveLocally = async (
  folder: "users" | "blogs",
  image: { buffer: Buffer },
  ext = "jpg",
) => {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Image upload requires Firebase storage in production (FIREBASE_SERVICE_ACCOUNT / FIREBASE_STORAGE_BUCKET)",
    );
  }

  const filename = `${uuidv4()}.${ext}`;
  const dir = uploadsDir(folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), image.buffer);

  const baseUrl = (
    process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`
  ).replace(/\/$/, "");
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

export const uploadProfileImage = async (image: any, user?: any) => {
  if (!isFirebaseConfigured()) {
    return saveLocally("users", image, "jpg");
  }

  ensureStorage();
  const bucket = getBucket();

  if (user && user.image) {
    try {
      const oldImageUrl = new URL(user.image);
      // Extract the path after the bucket name
      const pathSegments = oldImageUrl.pathname.split("/");
      const oldImagePath = pathSegments.slice(2).join("/");
      if (oldImagePath) {
        const oldFile = bucket.file(oldImagePath);
        await oldFile.delete();
      }
    } catch (error: any) {
      // Ignore 404 errors (file not found) but log other errors
      if (error.code !== 404) {
        console.error("Error deleting old image:", error.message);
      }
    }
  }

  // Generate unique name
  const filename = `users/${user._id}/pfp-${uuidv4()}`;

  // Upload
  const file = bucket.file(filename);
  await file.save(image.buffer, {
    metadata: {
      contentType: image.mimetype,
    },
  });

  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucketName()}/${filename}`;

  return publicUrl;
};

export const uploadBlogImage = async (image: any) => {
  if (!isFirebaseConfigured()) {
    return saveLocally("blogs", image, "jpg");
  }

  ensureStorage();
  const bucket = getBucket();
  const filename = `blogs/${uuidv4()}`;

  const file = bucket.file(filename);
  await file.save(image.buffer, {
    metadata: {
      contentType: image.mimetype,
    },
  });

  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucketName()}/${filename}`;

  return publicUrl;
};
