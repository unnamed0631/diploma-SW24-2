import cors from "cors";

const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8081",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8081",
];

function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return DEFAULT_ORIGINS;

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

const corsConfig = cors({
  methods: ["GET", "POST", "PUT", "DELETE"],
  maxAge: 600,
  credentials: true,
  origin: getAllowedOrigins(),
});

export default corsConfig;
