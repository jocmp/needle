import { describe, expect, test } from "bun:test";
import { Hono } from "hono";

describe("health check", () => {
  const app = new Hono();
  app.get("/up", (c) => c.text("OK"));

  test("returns OK", async () => {
    const res = await app.request("/up");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
  });
});
