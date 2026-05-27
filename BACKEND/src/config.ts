import "dotenv/config";

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000,http://localhost:3001,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = {
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? "0.0.0.0",
  databaseUrl: process.env.DATABASE_URL,
  appDbSchema: process.env.APP_DB_SCHEMA ?? "humantouch",
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",
  allowedOrigins
};

export function assertRuntimeConfig() {
  if (!config.geminiApiKey) {
    console.warn("Missing GEMINI_API_KEY in .env; chat streaming will fail until it is configured.");
  }
}
