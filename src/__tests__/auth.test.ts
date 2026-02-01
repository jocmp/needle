import { describe, expect, test } from "bun:test";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  password_confirmation: z.string().min(8),
});

describe("loginSchema", () => {
  test("validates valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "notanemail",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  test("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  test("validates valid signup data", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      password_confirmation: "password123",
    });
    expect(result.success).toBe(true);
  });

  test("rejects password under 8 characters", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "short",
      password_confirmation: "short",
    });
    expect(result.success).toBe(false);
  });

  test("rejects invalid email", () => {
    const result = signupSchema.safeParse({
      email: "notanemail",
      password: "password123",
      password_confirmation: "password123",
    });
    expect(result.success).toBe(false);
  });
});
