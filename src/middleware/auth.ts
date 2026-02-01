import { eq } from "drizzle-orm";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { db } from "../db";
import { users } from "../db/schema";

export type User = typeof users.$inferSelect;

declare module "hono" {
  interface ContextVariableMap {
    user: User | null;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "development-secret-change-me";

export { JWT_SECRET };

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = getCookie(c, "session");

  if (!token) {
    c.set("user", null);
    return next();
  }

  try {
    const payload = await verify(token, JWT_SECRET, "HS256");
    const userId = payload.userId as number;

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    c.set("user", user ?? null);
  } catch {
    c.set("user", null);
  }

  return next();
});

export const requireAuth = createMiddleware(async (c, next) => {
  const user = c.get("user");

  if (!user) {
    return c.redirect("/login");
  }

  return next();
});
