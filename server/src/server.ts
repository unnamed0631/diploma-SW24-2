import express, { Request, Response, NextFunction } from "express";
import http from "http";
import mongoose from "mongoose";
import { redisMiddleware } from "@/middleware/redisMiddleware";
import {
  scheduleStreakResetJob,
  stopStreakResetJob,
} from "@/jobs/streakResetJob";
import connectToMongoDB from "@/services/mongodb";
import limiter from "@/middleware/rateLimit";
import corsConfig from "@/middleware/cors";
import helmet from "@/middleware/helmet";
import cookieParser from "cookie-parser";
import router from "@/routes/route";
import bp from "body-parser";
import { redisService } from "@/services/redis";
import path from "path";
import os from "os";

const __dirname = path.resolve();

const app = express();

// Log requests (method + path only, never the query string)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const rawIp = req.headers["cf-connecting-ip"] || req.ip || "unknown";
  const ip = Array.isArray(rawIp) ? rawIp[0] : rawIp;
  const normalizedIp = ip.startsWith("::ffff:")
    ? ip.replace("::ffff:", "IPv4 ")
    : ip;
  console.log(`Request IP: ${normalizedIp} ~ ${req.method}: ${req.path}`);
  next();
});

app.set("trust proxy", 1);
app.use(helmet);
app.use(express.static(path.join(__dirname, "public")));
app.use(bp.urlencoded({ limit: "16mb", extended: true }));
app.use(redisMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use(corsConfig);
app.use(limiter);
app.use(router);

const PORT = Number(process.env.PORT) || 3000;

let server: http.Server | null = null;

async function startServer() {
  await connectToMongoDB();

  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  Object.keys(interfaces).forEach((interfaceName) => {
    const ifaceGroup = interfaces[interfaceName];
    ifaceGroup?.forEach((iface) => {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push(iface.address);
      }
    });
  });

  server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`Server listening on:`);
    console.log(`- Local: http://localhost:${PORT}`);
    addresses.forEach((addr) => {
      console.log(`- Network: http://${addr}:${PORT}`);
    });
  });

  scheduleStreakResetJob();
}

async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down gracefully...`);

  stopStreakResetJob();

  if (!server) {
    process.exit(0);
    return;
  }

  server.close(async () => {
    try {
      await mongoose.disconnect();
      console.log("MongoDB disconnected");
    } catch (err) {
      console.error("Error disconnecting MongoDB:", err);
    }

    try {
      await redisService.quit();
      console.log("Redis disconnected");
    } catch (err) {
      console.error("Error disconnecting Redis:", err);
    }

    process.exit(0);
  });

  // Force exit if open sockets keep the process alive.
  setTimeout(() => {
    console.error("Forcing shutdown after timeout");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
