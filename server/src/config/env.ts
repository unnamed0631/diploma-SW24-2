/**
 * Centralised environment loading + optional/external-service guards.
 *
 * Every secret is read lazily so the server can boot (and the seed script can
 * run) with a minimal `.env`: MongoDB + JWT secrets are required, everything
 * else is optional and its feature degrades instead of crashing the process.
 */

let loaded = false;

export function loadEnv(): void {
  if (loaded) return;
  loaded = true;
  try {
    process.loadEnvFile?.(".env");
  } catch {
    // File missing - fine, env vars may be provided by the shell.
  }
}

export const hasEnv = (key: string): boolean => Boolean(process.env[key]);

export const isFirebaseConfigured = (): boolean =>
  hasEnv("FIREBASE_SERVICE_ACCOUNT") && hasEnv("FIREBASE_STORAGE_BUCKET");

export const isAiConfigured = (): boolean => hasEnv("GEMINI_API_KEY");

export const isMailConfigured = (): boolean =>
  hasEnv("SMTP_USER") && hasEnv("SMTP_PASS");

export const isSeederMode = (): boolean => process.env.SEED_MODE === "true";
