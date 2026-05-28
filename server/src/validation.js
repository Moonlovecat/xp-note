import { z } from "zod";
import { commonCriteria, critiqueCriteria, reviewCriteria } from "./reviewCriteria.js";

const allowedScoreKeys = new Set([...commonCriteria, ...critiqueCriteria, ...reviewCriteria].map(field => field.key));
const critiqueScoreKeys = [...commonCriteria, ...critiqueCriteria].map(field => field.key);

const invalidFilterMessages = {
  reviewType: "지원하지 않는 작성 유형 필터입니다.",
  type: "지원하지 않는 리뷰 유형입니다.",
  sort: "지원하지 않는 정렬입니다.",
  ratingMin: "평점 필터는 0부터 5까지의 숫자로 입력해주세요."
};

function optionalNumber(schema) {
  return z.preprocess(
    value => value === "" || value === undefined ? undefined : value,
    schema.optional()
  );
}

function formatIssue(issue) {
  const path = issue.path.join(".");
  if (issue.code === "unrecognized_keys") {
    const keys = issue.keys.join(", ");
    return {
      path: keys,
      message: `지원하지 않는 필터입니다: ${keys}`
    };
  }
  if (path && invalidFilterMessages[path]) {
    return {
      path,
      message: invalidFilterMessages[path]
    };
  }
  return {
    path,
    message: issue.message
  };
}

export const signupSchema = z.strictObject({
  nickname: z.string().trim()
    .min(2, "닉네임은 2자 이상 입력해주세요.")
    .max(20, "닉네임은 20자 이하로 입력해주세요."),
  email: z.string().trim()
    .email("올바른 이메일을 입력해주세요.")
    .max(120, "이메일은 120자 이하로 입력해주세요.")
    .transform(value => value.toLowerCase()),
  password: z.string()
    .min(8, "비밀번호는 8자 이상 입력해주세요.")
    .max(100, "비밀번호는 100자 이하로 입력해주세요.")
    .regex(/[A-Za-z]/, "비밀번호에는 영문자를 포함해주세요.")
    .regex(/[0-9]/, "비밀번호에는 숫자를 포함해주세요.")
    .regex(/[^A-Za-z0-9]/, "비밀번호에는 특수문자를 포함해주세요.")
});

export const loginSchema = z.strictObject({
  email: z.string().trim()
    .email("올바른 이메일을 입력해주세요.")
    .max(120, "이메일은 120자 이하로 입력해주세요.")
    .transform(value => value.toLowerCase()),
  password: z.string()
    .min(1, "비밀번호를 입력해주세요.")
    .max(100, "비밀번호는 100자 이하로 입력해주세요.")
});

export const gamesQuerySchema = z.strictObject({
  query: z.string().trim().max(80, "검색어는 80자 이하로 입력해주세요.").optional().default(""),
  genre: z.string().trim().max(40, "장르는 40자 이하로 입력해주세요.").optional().default(""),
  reviewType: z.enum(["", "critique", "review"]).optional().default(""),
  ratingMin: optionalNumber(z.coerce.number().min(0).max(5)),
  sort: z.enum(["popular", "newest", "rating", "critique", "review"]).optional().default("popular")
});

export const reviewsQuerySchema = z.strictObject({
  type: z.enum(["", "all", "critique", "review"]).optional().default("all"),
  sort: z.enum(["popular", "newest", "rating"]).optional().default("popular")
});

export const reviewBodySchema = z.strictObject({
  type: z.enum(["critique", "review"]),
  rating: z.coerce.number()
    .min(0.5, "별점은 0.5점 이상 입력해주세요.")
    .max(5, "별점은 5점 이하로 입력해주세요.")
    .refine(value => Number.isInteger(value * 2), "별점은 0.5점 단위로 입력해주세요."),
  headline: z.string().trim().max(100, "제목은 100자 이하로 입력해주세요.").optional().default(""),
  comment: z.string().trim()
    .min(1, "코멘트를 입력해주세요.")
    .max(900, "코멘트는 900자 이하로 입력해주세요."),
  recommendation: z.string().trim().max(80, "추천 대상은 80자 이하로 입력해주세요.").optional().default(""),
  scores: z.record(z.string(), z.coerce.number().int().min(1).max(5)).default({})
}).superRefine((value, context) => {
  const scoreKeys = Object.keys(value.scores);
  if (value.type === "review") {
    if (scoreKeys.length) {
      context.addIssue({
        code: "custom",
        path: ["scores"],
        message: "리뷰는 별점과 코멘트만 입력해주세요. 항목별 점수는 평론에서만 사용합니다."
      });
    }
    if (value.recommendation) {
      context.addIssue({
        code: "custom",
        path: ["recommendation"],
        message: "리뷰는 추천 대상 없이 별점과 코멘트만 입력해주세요."
      });
    }
    return;
  }

  const missingKeys = critiqueScoreKeys.filter(key => value.scores[key] === undefined);
  if (missingKeys.length) {
    context.addIssue({
      code: "custom",
      path: ["scores"],
      message: "평론은 항목별 점수를 모두 입력해주세요."
    });
  }

  Object.keys(value.scores).forEach(key => {
    if (!allowedScoreKeys.has(key)) {
      context.addIssue({
        code: "custom",
        path: ["scores", key],
        message: `Unsupported score key: ${key}`
      });
    }
  });
});

export const gameRequestSchema = z.strictObject({
  title: z.string().trim()
    .min(1, "게임 제목을 입력해주세요.")
    .max(80, "게임 제목은 80자 이하로 입력해주세요."),
  platform: z.enum(["Nintendo", "PlayStation", "Xbox", "PC", "Other"]),
  year: optionalNumber(z.coerce.number().int().min(1980).max(2035)).nullable(),
  reason: z.string().trim()
    .min(1, "신청 이유를 입력해주세요.")
    .max(500, "신청 이유는 500자 이하로 입력해주세요.")
});

export function validate(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return { data: result.data, error: null };
  const issues = result.error.issues.map(formatIssue);

  return {
    data: null,
    error: {
      error: "Validation failed",
      issues
    }
  };
}
