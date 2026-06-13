import dotenv from "dotenv";

dotenv.config();

export function getConfig() {
  const jwtSecret = process.env.JWT_SECRET;
  const databaseUrl = process.env.DATABASE_URL;
  const nodeEnv = process.env.NODE_ENV || "production";

  // Vercel 환경에서 환경 변수가 누락되는 경우가 있어 명시적으로 체크
  if (!jwtSecret) {
    console.error("CRITICAL ERROR: JWT_SECRET is missing from environment variables!");
  }
  if (!databaseUrl) {
    console.error("CRITICAL ERROR: DATABASE_URL is missing from environment variables!");
  }

  return {
    port: Number(process.env.PORT || 3000),
    host: process.env.HOST || "0.0.0.0",
    jwtSecret: jwtSecret || "temporary-secret-for-debug",
    databaseUrl,
    nodeEnv,
    trustProxy: process.env.TRUST_PROXY === "true" || process.env.TRUST_PROXY === "1",
    cookieSecure: process.env.COOKIE_SECURE
      ? process.env.COOKIE_SECURE === "true"
      : nodeEnv === "production",
    cookieName: "weenai_token"
  };
}
