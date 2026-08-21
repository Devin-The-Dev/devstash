import { describe, expect, it } from "vitest";
import { signInSchema, registerSchema, resetPasswordSchema } from "@/lib/validations/auth";

describe("signInSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    const result = signInSchema.safeParse({ email: "a@b.com", password: "hunter2" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = signInSchema.safeParse({ email: "not-an-email", password: "hunter2" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const base = {
    name: "Devin",
    email: "a@b.com",
    password: "password123",
    confirmPassword: "password123",
  };

  it("accepts matching passwords of sufficient length", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it("rejects mismatched passwords with an error on confirmPassword", () => {
    const result = registerSchema.safeParse({ ...base, confirmPassword: "different" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...base, password: "short", confirmPassword: "short" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "password123",
      confirmPassword: "password124",
    });
    expect(result.success).toBe(false);
  });
});
