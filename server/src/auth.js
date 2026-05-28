import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getConfig } from "./config.js";

const passwordRounds = 12;

export async function hashPassword(password) {
  return bcrypt.hash(password, passwordRounds);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    createdAt: user.createdAt
  };
}

export function signUserToken(user) {
  const config = getConfig();
  return jwt.sign(
    { sub: user.id, email: user.email, nickname: user.nickname },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}

export function verifyUserToken(token) {
  const config = getConfig();
  return jwt.verify(token, config.jwtSecret);
}

export function authCookieOptions() {
  const config = getConfig();
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: config.cookieSecure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
  };
}

export function clearCookieOptions() {
  return {
    ...authCookieOptions(),
    maxAge: 0
  };
}

export function optionalAuth(prisma) {
  return async (req, _res, next) => {
    const config = getConfig();
    const token = req.cookies?.[config.cookieName];
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const payload = verifyUserToken(token);
      req.user = await prisma.user.findUnique({ where: { id: payload.sub } });
    } catch {
      req.user = null;
    }

    return next();
  };
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }
  return next();
}
