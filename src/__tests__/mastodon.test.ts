import { describe, expect, test } from "bun:test";
import { normalizeHandle } from "../services/mastodon";

describe("normalizeHandle", () => {
  test("normalizes plain username", () => {
    expect(normalizeHandle("zuck")).toBe("zuck@threads.net");
  });

  test("normalizes username with @ prefix", () => {
    expect(normalizeHandle("@zuck")).toBe("zuck@threads.net");
  });

  test("normalizes full handle with domain", () => {
    expect(normalizeHandle("zuck@threads.net")).toBe("zuck@threads.net");
  });

  test("normalizes threads.net URL", () => {
    expect(normalizeHandle("https://www.threads.net/@zuck")).toBe(
      "zuck@threads.net",
    );
  });

  test("normalizes threads.com URL", () => {
    expect(normalizeHandle("https://threads.com/@zuck")).toBe(
      "zuck@threads.net",
    );
  });

  test("normalizes mastodon.social URL", () => {
    expect(normalizeHandle("https://mastodon.social/@zuck@threads.net")).toBe(
      "zuck@threads.net",
    );
  });

  test("handles uppercase", () => {
    expect(normalizeHandle("ZUCK")).toBe("zuck@threads.net");
  });

  test("trims whitespace", () => {
    expect(normalizeHandle("  zuck  ")).toBe("zuck@threads.net");
  });
});
