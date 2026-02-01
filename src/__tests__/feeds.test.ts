import { describe, expect, test } from "bun:test";
import { z } from "zod";

const createFeedSchema = z.object({
  handle: z.string().min(1),
});

describe("createFeedSchema", () => {
  test("validates valid handle", () => {
    const result = createFeedSchema.safeParse({ handle: "@zuck" });
    expect(result.success).toBe(true);
  });

  test("validates URL handle", () => {
    const result = createFeedSchema.safeParse({
      handle: "https://www.threads.net/@zuck",
    });
    expect(result.success).toBe(true);
  });

  test("rejects empty handle", () => {
    const result = createFeedSchema.safeParse({ handle: "" });
    expect(result.success).toBe(false);
  });

  test("rejects missing handle", () => {
    const result = createFeedSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
