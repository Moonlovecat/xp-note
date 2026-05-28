import { describe, expect, it } from "vitest";
import {
  gameRequestSchema,
  gamesQuerySchema,
  reviewBodySchema,
  reviewsQuerySchema,
  signupSchema,
  validate
} from "../src/validation.js";

describe("request validation", () => {
  it("normalizes signup email", () => {
    const { data, error } = validate(signupSchema, {
      nickname: "tester",
      email: "TESTER@EXAMPLE.COM",
      password: "Pass1234!"
    });

    expect(error).toBeNull();
    expect(data.email).toBe("tester@example.com");
  });

  it("rejects invalid score keys", () => {
    const { error } = validate(reviewBodySchema, {
      type: "critique",
      rating: 4.5,
      comment: "good",
      scores: {
        gameplay: 5,
        unknown: 4
      }
    });

    expect(error).not.toBeNull();
    expect(error.issues.some(issue => issue.path === "scores.unknown")).toBe(true);
  });

  it("accepts simple review payloads without item scores", () => {
    const { data, error } = validate(reviewBodySchema, {
      type: "review",
      rating: 4.5,
      comment: "가볍게 남기는 리뷰"
    });

    expect(error).toBeNull();
    expect(data.scores).toEqual({});
  });

  it("rejects item scores on simple review payloads", () => {
    const { error } = validate(reviewBodySchema, {
      type: "review",
      rating: 4,
      comment: "리뷰에는 항목별 점수를 쓰지 않습니다.",
      scores: { fun: 5 }
    });

    expect(error).not.toBeNull();
    expect(error.issues[0].path).toBe("scores");
  });

  it("requires critique payloads to include item scores", () => {
    const { error } = validate(reviewBodySchema, {
      type: "critique",
      rating: 4,
      comment: "평론에는 항목별 점수가 필요합니다."
    });

    expect(error).not.toBeNull();
    expect(error.issues.some(issue => issue.path === "scores")).toBe(true);
  });

  it("rejects retired hard and light review type names", () => {
    expect(validate(reviewBodySchema, {
      type: "hard",
      rating: 4,
      comment: "old type",
      scores: { gameplay: 4 }
    }).error).not.toBeNull();

    expect(validate(reviewBodySchema, {
      type: "light",
      rating: 4,
      comment: "old type",
      scores: { fun: 4 }
    }).error).not.toBeNull();
  });

  it("requires signup passwords to include letters, numbers, and symbols", () => {
    const { error } = validate(signupSchema, {
      nickname: "tester",
      email: "tester@example.com",
      password: "password123"
    });

    expect(error).not.toBeNull();
    expect(error.issues.some(issue => issue.message.includes("특수문자"))).toBe(true);
  });

  it("rejects unknown games query parameters", () => {
    const { error } = validate(gamesQuerySchema, {
      type: "bad"
    });

    expect(error).not.toBeNull();
    expect(error.issues[0]).toEqual({
      path: "type",
      message: "지원하지 않는 필터입니다: type"
    });
  });

  it("rejects invalid games query values", () => {
    expect(validate(gamesQuerySchema, {
      ratingMin: "abc"
    }).error.issues[0].path).toBe("ratingMin");

    expect(validate(gamesQuerySchema, {
      ratingMin: "9"
    }).error.issues[0].path).toBe("ratingMin");

    expect(validate(gamesQuerySchema, {
      sort: "bad"
    }).error.issues[0].path).toBe("sort");
  });

  it("accepts documented review list query values", () => {
    expect(validate(reviewsQuerySchema, {
      type: "all",
      sort: "popular"
    }).error).toBeNull();

    expect(validate(reviewsQuerySchema, {
      type: "critique",
      sort: "rating"
    }).error).toBeNull();
  });

  it("accepts game request payloads", () => {
    const { data, error } = validate(gameRequestSchema, {
      title: "신청 게임",
      platform: "Nintendo",
      year: 2026,
      reason: "리뷰 후보"
    });

    expect(error).toBeNull();
    expect(data.title).toBe("신청 게임");
  });
});
