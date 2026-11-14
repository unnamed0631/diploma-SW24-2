import { promises as fs } from "fs";
import path from "path";

/**
 * Dev-only replacement for the Firebase bucket, used by the seed script so
 * avatars/post images resolve locally without any cloud credentials.
 *
 * Files are written to `server/public/uploads/<folder>/<name>` and served by
 * express.static from `server/public`, i.e. `<BASE_URL>/uploads/...`.
 */
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

// 1x1 transparent PNG.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

export const baseUrl = () =>
  (
    process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`
  ).replace(/\/$/, "");

export async function localImage(
  folder: "users" | "blogs",
  name: string,
): Promise<string> {
  const dir = path.join(UPLOAD_ROOT, folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${name}.png`), PIXEL);
  return `${baseUrl()}/uploads/${folder}/${name}.png`;
}

export async function clearLocalUploads(): Promise<void> {
  await fs.rm(UPLOAD_ROOT, { recursive: true, force: true });
}
