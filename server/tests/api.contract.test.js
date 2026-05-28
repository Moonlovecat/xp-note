import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";

function createTestApp() {
  const prisma = {
    user: {
      findUnique: vi.fn().mockResolvedValue(null)
    }
  };
  return createApp(prisma);
}

describe("API contract", () => {
  it("returns JSON errors for invalid game query parameters", async () => {
    const app = createTestApp();

    const unknown = await request(app).get("/api/games?type=bad").expect(400);
    expect(unknown.body.error).toBe("Validation failed");
    expect(unknown.body.issues[0].message).toContain("type");

    const nonNumeric = await request(app).get("/api/games?ratingMin=abc").expect(400);
    expect(nonNumeric.body.error).toBe("Validation failed");
    expect(nonNumeric.body.issues[0].message).toContain("평점");

    const outOfRange = await request(app).get("/api/games?ratingMin=9").expect(400);
    expect(outOfRange.body.error).toBe("Validation failed");
    expect(outOfRange.body.issues[0].message).toContain("평점");
  });

  it("returns JSON errors for invalid review list query parameters", async () => {
    const app = createTestApp();

    const response = await request(app).get("/api/games/1/reviews?type=bad").expect(400);
    expect(response.body.error).toBe("Validation failed");
    expect(response.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "type" })
      ])
    );
  });

  it("separates API 404 responses from page 404 responses", async () => {
    const app = createTestApp();

    const apiMissing = await request(app).get("/api/does-not-exist").expect(404);
    expect(apiMissing.type).toBe("application/json");
    expect(apiMissing.body.error).toContain("API");

    const pageMissing = await request(app).get("/does-not-exist").expect(404);
    expect(pageMissing.type).toMatch(/html/);
    expect(pageMissing.text).toContain("페이지를 찾을 수 없습니다");
  });

  it("returns useful auth error bodies", async () => {
    const app = createTestApp();

    const protectedResponse = await request(app)
      .post("/api/game-requests")
      .send({ title: "신청", platform: "Nintendo", reason: "no auth" })
      .expect(401);
    expect(protectedResponse.body.error).toBe("로그인이 필요합니다.");

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: "missing@example.com", password: "wrong" })
      .expect(401);
    expect(loginResponse.body.error).toBe("이메일 또는 비밀번호가 올바르지 않습니다.");
  });

  it("sets MVP security headers without blocking inline static assets", async () => {
    const app = createTestApp();

    const response = await request(app).get("/").expect(200);
    expect(response.headers["content-security-policy"]).toContain("default-src 'self'");
    expect(response.headers["content-security-policy"]).toContain("script-src 'self' 'unsafe-inline'");
    expect(response.headers["permissions-policy"]).toContain("camera=()");
  });
});
