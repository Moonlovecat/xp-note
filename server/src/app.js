import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import {
  authCookieOptions,
  clearCookieOptions,
  hashPassword,
  optionalAuth,
  publicUser,
  requireAuth,
  signUserToken,
  verifyPassword
} from "./auth.js";
import { getConfig } from "./config.js";
import {
  averageRating,
  ratingDistribution,
  reviewCounts,
  scoreAverages,
  serializeGame,
  serializeGameRequest,
  serializeReview
} from "./serializers.js";
import { matchesGameSearch } from "./search.js";
import { fieldLabels } from "./reviewCriteria.js";
import {
  gameRequestSchema,
  gamesQuerySchema,
  loginSchema,
  reviewBodySchema,
  reviewsQuerySchema,
  signupSchema,
  validate
} from "./validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function sendError(res, status, message, issues) {
  const body = { error: message };
  if (issues) body.issues = issues;
  return res.status(status).json(body);
}

function validationError(res, error) {
  return sendError(res, 400, error.error, error.issues);
}

function recommendationTag(value) {
  return value ? `추천:${value}` : null;
}

function tagsForReview(type, recommendation) {
  const tags = type === "critique" ? ["평론", "분석"] : ["리뷰", "체감"];
  const recommendationValue = recommendationTag(recommendation);
  if (recommendationValue) tags.push(recommendationValue);
  return tags;
}

function scoreCreates(scores) {
  return Object.entries(scores).map(([criterionKey, value]) => ({
    criterionKey,
    criterionLabel: fieldLabels[criterionKey] || criterionKey,
    value
  }));
}

async function writeReviewWithScores(prisma, reviewId, scores) {
  await prisma.reviewScore.deleteMany({ where: { reviewId } });
  const data = scoreCreates(scores).map(score => ({ ...score, reviewId }));
  if (data.length) {
    await prisma.reviewScore.createMany({ data });
  }
}

async function getGameWithReviews(prisma, gameId) {
  return prisma.game.findUnique({
    where: { id: gameId },
    include: {
      reviews: {
        include: {
          user: true,
          scores: true
        }
      }
    }
  });
}

export function createApp(prisma) {
  const app = express();
  const config = getConfig();

  app.set("trust proxy", config.trustProxy);
  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        "default-src": ["'self'"],
        "base-uri": ["'self'"],
        "connect-src": ["'self'"],
        "font-src": ["'self'", "data:"],
        "form-action": ["'self'"],
        "frame-ancestors": ["'self'"],
        "img-src": ["'self'", "data:", "https:"],
        "object-src": ["'none'"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"]
      }
    }
  }));
  app.use((_req, res, next) => {
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    next();
  });
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan(config.nodeEnv === "test" ? "tiny" : "dev"));
  app.use(optionalAuth(prisma));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/auth/signup", async (req, res, next) => {
    try {
      const { data, error } = validate(signupSchema, req.body);
      if (error) return validationError(res, error);

      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email },
            { nickname: data.nickname }
          ]
        }
      });
      if (existing) {
        return sendError(res, 409, "이미 사용 중인 이메일 또는 닉네임입니다.");
      }

      const user = await prisma.user.create({
        data: {
          email: data.email,
          nickname: data.nickname,
          passwordHash: await hashPassword(data.password)
        }
      });
      res.cookie(config.cookieName, signUserToken(user), authCookieOptions());
      return res.status(201).json({ user: publicUser(user) });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const { data, error } = validate(loginSchema, req.body);
      if (error) return validationError(res, error);

      const user = await prisma.user.findUnique({ where: { email: data.email } });
      if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
        return sendError(res, 401, "이메일 또는 비밀번호가 올바르지 않습니다.");
      }

      res.cookie(config.cookieName, signUserToken(user), authCookieOptions());
      return res.json({ user: publicUser(user) });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.cookie(config.cookieName, "", clearCookieOptions());
    res.json({ ok: true });
  });

  app.get("/api/auth/me", (req, res) => {
    res.json({ user: publicUser(req.user) });
  });

  app.get("/api/games", async (req, res, next) => {
    try {
      const { data, error } = validate(gamesQuerySchema, req.query);
      if (error) return validationError(res, error);

      const games = await prisma.game.findMany({
        include: {
          reviews: {
            select: {
              type: true,
              rating: true
            }
          }
        }
      });
      const requestCount = await prisma.gameRequest.count();
      const reviewCount = await prisma.review.count();

      let items = games.map(serializeGame).filter(game => {
        if (data.query && !matchesGameSearch(game, data.query)) return false;
        if (data.genre && game.genre !== data.genre) return false;
        if (data.reviewType === "critique" && game.critiqueCount === 0) return false;
        if (data.reviewType === "review" && game.regularReviewCount === 0) return false;
        if (data.ratingMin && (!game.averageRating || game.averageRating < data.ratingMin)) return false;
        return true;
      });

      items = items.sort((a, b) => {
        if (data.sort === "newest") return b.year - a.year || a.title.localeCompare(b.title, "ko");
        if (data.sort === "rating") return (b.averageRating || 0) - (a.averageRating || 0) || b.reviewCount - a.reviewCount;
        if (data.sort === "critique") return b.critiqueCount - a.critiqueCount || b.reviewCount - a.reviewCount;
        if (data.sort === "review") return b.regularReviewCount - a.regularReviewCount || b.reviewCount - a.reviewCount;
        return b.reviewCount - a.reviewCount || (b.averageRating || 0) - (a.averageRating || 0);
      });

      return res.json({
        games: items,
        stats: {
          gameCount: games.length,
          reviewCount,
          requestCount,
          genres: [...new Set(games.map(game => game.genre))].sort((a, b) => a.localeCompare(b, "ko"))
        }
      });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/games/:id", async (req, res, next) => {
    try {
      const gameId = parseId(req.params.id);
      if (!gameId) return sendError(res, 400, "게임 ID가 올바르지 않습니다.");

      const game = await getGameWithReviews(prisma, gameId);
      if (!game) return sendError(res, 404, "게임을 찾을 수 없습니다.");

      const counts = reviewCounts(game.reviews);
      const myReview = req.user ? game.reviews.find(review => review.userId === req.user.id) : null;
      return res.json({
        game: serializeGame(game),
        aggregates: {
          averageRating: averageRating(game.reviews),
          counts,
          scoreAverages: scoreAverages(game.reviews),
          ratingDistribution: ratingDistribution(game.reviews)
        },
        myReview: myReview ? serializeReview(myReview, req.user.id) : null
      });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/games/:id/reviews", async (req, res, next) => {
    try {
      const gameId = parseId(req.params.id);
      if (!gameId) return sendError(res, 400, "게임 ID가 올바르지 않습니다.");
      const { data, error } = validate(reviewsQuerySchema, req.query);
      if (error) return validationError(res, error);

      const where = {
        gameId,
        ...(data.type && data.type !== "all" ? { type: data.type } : {})
      };
      const orderBy = data.sort === "newest"
        ? [{ createdAt: "desc" }]
        : data.sort === "rating"
          ? [{ rating: "desc" }, { createdAt: "desc" }]
          : [{ helpfulCount: "desc" }, { rating: "desc" }, { createdAt: "desc" }];

      const reviews = await prisma.review.findMany({
        where,
        orderBy,
        include: {
          user: true,
          scores: true
        }
      });
      return res.json({ reviews: reviews.map(review => serializeReview(review, req.user?.id)) });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/games/:id/reviews", requireAuth, async (req, res, next) => {
    try {
      const gameId = parseId(req.params.id);
      if (!gameId) return sendError(res, 400, "게임 ID가 올바르지 않습니다.");
      const { data, error } = validate(reviewBodySchema, req.body);
      if (error) return validationError(res, error);

      const game = await prisma.game.findUnique({ where: { id: gameId } });
      if (!game) return sendError(res, 404, "게임을 찾을 수 없습니다.");

      const existing = await prisma.review.findUnique({
        where: { userId_gameId: { userId: req.user.id, gameId } }
      });
      if (existing) {
        return sendError(res, 409, "이미 이 게임에 작성한 글이 있습니다. 기존 글을 수정해 주세요.");
      }

      const review = await prisma.review.create({
        data: {
          userId: req.user.id,
          gameId,
          type: data.type,
          rating: data.rating,
          headline: data.headline || null,
          comment: data.comment,
          tags: tagsForReview(data.type, data.recommendation),
          playtimeHours: 0,
          helpfulCount: 0
        },
        include: { user: true, scores: true }
      });
      await writeReviewWithScores(prisma, review.id, data.scores);

      const created = await prisma.review.findUnique({
        where: { id: review.id },
        include: { user: true, scores: true }
      });
      return res.status(201).json({ review: serializeReview(created, req.user.id) });
    } catch (error) {
      return next(error);
    }
  });

  app.put("/api/reviews/:id", requireAuth, async (req, res, next) => {
    try {
      const { data, error } = validate(reviewBodySchema, req.body);
      if (error) return validationError(res, error);

      const existing = await prisma.review.findUnique({ where: { id: req.params.id } });
      if (!existing) return sendError(res, 404, "글을 찾을 수 없습니다.");
      if (existing.userId !== req.user.id) return sendError(res, 403, "다른 사용자의 글은 수정할 수 없습니다.");

      await prisma.review.update({
        where: { id: req.params.id },
        data: {
          type: data.type,
          rating: data.rating,
          headline: data.headline || null,
          comment: data.comment,
          tags: tagsForReview(data.type, data.recommendation)
        }
      });
      await writeReviewWithScores(prisma, req.params.id, data.scores);

      const updated = await prisma.review.findUnique({
        where: { id: req.params.id },
        include: { user: true, scores: true }
      });
      return res.json({ review: serializeReview(updated, req.user.id) });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/game-requests/me", requireAuth, async (req, res, next) => {
    try {
      const requests = await prisma.gameRequest.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        include: { user: true }
      });
      return res.json({ requests: requests.map(serializeGameRequest) });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/game-requests", requireAuth, async (req, res, next) => {
    try {
      const { data, error } = validate(gameRequestSchema, req.body);
      if (error) return validationError(res, error);

      const request = await prisma.gameRequest.create({
        data: {
          userId: req.user.id,
          title: data.title,
          platform: data.platform,
          year: data.year || null,
          reason: data.reason,
          status: "pending"
        },
        include: { user: true }
      });
      return res.status(201).json({ request: serializeGameRequest(request) });
    } catch (error) {
      return next(error);
    }
  });

  app.use("/api", (_req, res) => {
    return sendError(res, 404, "API 경로를 찾을 수 없습니다.");
  });

  app.use(express.static(projectRoot));
  app.use((req, res) => {
    const wantsJson = req.accepts(["html", "json"]) === "json";
    if (wantsJson) {
      return sendError(res, 404, "페이지를 찾을 수 없습니다.");
    }
    return res.status(404).type("html").send("<!doctype html><title>404</title><h1>404 Not Found</h1><p>페이지를 찾을 수 없습니다.</p>");
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    return sendError(res, 500, "서버 오류가 발생했습니다.");
  });

  return app;
}
