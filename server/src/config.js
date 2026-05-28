import dotenv from "dotenv";

dotenv.config();

export function getConfig() {
  const jwtSecret = process.env.JWT_SECRET;
  const databaseUrl = process.env.DATABASE_URL;
  const nodeEnv = process.env.NODE_ENV || "development";

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required. Copy server/.env.example to server/.env and set a strong value.");
  }
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required. Copy server/.env.example to server/.env.");
  }

  return {
    port: Number(process.env.PORT || 3000),
    host: process.env.HOST || "0.0.0.0",
    jwtSecret,
    databaseUrl,
    nodeEnv,
    trustProxy: process.env.TRUST_PROXY === "true",
    cookieSecure: process.env.COOKIE_SECURE
      ? process.env.COOKIE_SECURE === "true"
      : nodeEnv === "production",
    cookieName: "weenai_token"
  };
}
