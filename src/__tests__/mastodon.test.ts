import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import {
  AccountNotFound,
  FetchError,
  fetchStatuses,
  lookupAccount,
  normalizeHandle,
} from "../services/mastodon";

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

describe("lookupAccount", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns account data for valid handle", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            id: "123",
            username: "zuck",
            display_name: "Mark Zuckerberg",
            url: "https://threads.net/@zuck",
            avatar: "https://example.com/avatar.jpg",
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await lookupAccount("zuck");
    expect(result.id).toBe("123");
    expect(result.display_name).toBe("Mark Zuckerberg");
  });

  test("throws AccountNotFound for 404", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(null, { status: 404 })),
    );

    expect(lookupAccount("nonexistent")).rejects.toBeInstanceOf(
      AccountNotFound,
    );
  });

  test("throws FetchError for server error", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(null, { status: 500 })),
    );

    expect(lookupAccount("zuck")).rejects.toBeInstanceOf(FetchError);
  });
});

describe("fetchStatuses", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns statuses for account", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify([
            {
              id: "post1",
              content: "<p>Hello world</p>",
              url: "https://threads.net/@zuck/post/123",
              created_at: "2024-01-01T12:00:00Z",
            },
          ]),
          { status: 200 },
        ),
      ),
    );

    const result = await fetchStatuses("123");
    expect(result.length).toBe(1);
    expect(result[0].content).toBe("<p>Hello world</p>");
  });

  test("throws FetchError on failure", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(null, { status: 500 })),
    );

    expect(fetchStatuses("123")).rejects.toBeInstanceOf(FetchError);
  });
});
