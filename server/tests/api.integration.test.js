import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const shouldRun = process.env.RUN_DB_TESTS === "1";
const describeDb = shouldRun ? describe : describe.skip;

describe("API error boundaries", () => {
  const app = createApp({});

  it("rejects unsupported game query parameters before hitting storage", async () => {
    const response = await request(app)
      .get("/api/games?type=bad")
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
    expect(response.body.issues[0].path).toBe("type");
  });

  it("rejects invalid numeric filters", async () => {
    const response = await request(app)
      .get("/api/games?ratingMin=abc")
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
    expect(response.body.issues[0].path).toBe("ratingMin");
  });

  it("returns JSON for unknown API routes", async () => {
    const response = await request(app)
      .get("/api/does-not-exist")
      .expect(404);

    expect(response.body).toEqual({ error: "API 경로를 찾을 수 없습니다." });
  });

  it("does not serve the app shell for unknown page routes", async () => {
    const response = await request(app)
      .get("/does-not-exist")
      .set("Accept", "text/html")
      .expect(404);

    expect(response.text).toContain("404 Not Found");
    expect(response.text).not.toContain("Weenai Korean Game Reviews");
  });
});

describeDb("API integration", () => {
  let prisma;
  let app;
  let agent;

  beforeAll(async () => {
    prisma = new PrismaClient();
    app = createApp(prisma);
    agent = request.agent(app);
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it("signs up, creates a review, edits it, and submits a game request", async () => {
    const unique = Date.now();

    const signup = await agent
      .post("/api/auth/signup")
      .send({
        nickname: `tester-${unique}`,
        email: `tester-${unique}@example.com`,
        password: "Pass1234!"
      })
      .expect(201);
    expect(signup.body.user.email).toBe(`tester-${unique}@example.com`);

    const games = await agent.get("/api/games").expect(200);
    expect(games.body.games.length).toBeGreaterThanOrEqual(20);

    const created = await agent
      .post("/api/games/1/reviews")
      .send({
        type: "review",
        rating: 4.5,
        comment: "integration review",
        scores: {}
      })
      .expect(201);

    expect(created.body.review.scores).toEqual({});

    await agent
      .put(`/api/reviews/${created.body.review.id}`)
      .send({
        type: "critique",
        rating: 5,
        comment: "edited review",
        scores: { value: 5, graphics: 5, ost: 5, control: 5, immersion: 5, gameplay: 5, strategy: 4, optimization: 5, story: 4, difficulty: 3, sfx: 5 }
      })
      .expect(200);

    await agent
      .post("/api/game-requests")
      .send({
        title: "integration request game",
        platform: "Nintendo",
        year: 2026,
        reason: "integration flow"
      })
      .expect(201);
  });

  it("rejects protected mutations without auth", async () => {
    await request(app)
      .post("/api/game-requests")
      .send({
        title: "rejected test",
        platform: "Nintendo",
        reason: "no auth"
      })
      .expect(401)
      .expect(response => {
        expect(response.body.error).toBe("로그인이 필요합니다.");
      });
  });
});
