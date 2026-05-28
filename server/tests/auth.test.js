import { describe, expect, it } from "vitest";
import { hashPassword, signUserToken, verifyPassword, verifyUserToken } from "../src/auth.js";

describe("auth helpers", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("password123");

    expect(hash).not.toBe("password123");
    await expect(verifyPassword("password123", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });

  it("issues and verifies JWT tokens", () => {
    const token = signUserToken({
      id: "user-1",
      email: "tester@example.com",
      nickname: "테스터"
    });

    const payload = verifyUserToken(token);
    expect(payload.sub).toBe("user-1");
    expect(payload.email).toBe("tester@example.com");
  });
});
