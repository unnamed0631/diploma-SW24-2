import type { RedisService } from "@/services/redis";
import type { UserPayload } from "@/controllers/token";

declare global {
  namespace Express {
    interface Request {
      redis: RedisService;
      user: UserPayload;
    }
  }

  // Bun exposes `loadEnvFile` on `process`; declare it so `tsc` (Node types) is happy.
  interface Process {
    loadEnvFile?: (path?: string) => void;
  }
}

export {};
