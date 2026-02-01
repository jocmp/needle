import { hash, verify } from "@node-rs/bcrypt";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { z } from "zod";
import { Layout } from "../components/Layout";
import { db } from "../db";
import { users } from "../db/schema";
import { alertUrl } from "../lib/alerts";
import { JWT_SECRET } from "../middleware/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  password_confirmation: z.string().min(8),
});

const app = new Hono();

const REGISTRATION_ENABLED = process.env.REGISTRATION_ENABLED === "true";

// Login page
app.get("/login", (c) => {
  const alert = c.req.query("alert");

  return c.html(
    <Layout alert={alert}>
      <div class="max-w-md mx-auto text-center">
        <h1 class="font-display text-3xl text-burgundy-dark mb-2">
          Welcome Back
        </h1>
        <p class="text-aged italic mb-8">Enter thy credentials to proceed</p>

        <div class="flex justify-center mb-6">
          <span class="text-gold">&#10070; &#10070; &#10070;</span>
        </div>

        <form method="post" action="/login" class="space-y-6 text-left">
          <div>
            <label
              for="login-email"
              class="block text-sm font-semibold text-aged uppercase tracking-wide mb-1"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              required
              class="w-full px-4 py-3 border-2 border-aged/30 bg-parchment focus:border-gold focus:outline-none font-body"
            />
          </div>

          <div>
            <label
              for="login-password"
              class="block text-sm font-semibold text-aged uppercase tracking-wide mb-1"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              name="password"
              required
              class="w-full px-4 py-3 border-2 border-aged/30 bg-parchment focus:border-gold focus:outline-none font-body"
            />
          </div>

          <button
            type="submit"
            class="w-full bg-burgundy text-gold py-3 px-6 uppercase tracking-widest hover:bg-burgundy-dark cursor-pointer transition-colors border-2 border-gold"
          >
            Enter
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-aged/20">
          <p class="text-aged">
            Not yet registered?{" "}
            <a
              href="/signup"
              class="text-burgundy hover:text-burgundy-dark underline"
            >
              Create an account
            </a>
          </p>
        </div>
      </div>
    </Layout>,
  );
});

// Login handler
app.post("/login", async (c) => {
  const body = await c.req.parseBody();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.redirect(alertUrl("/login", "invalid-credentials"));
  }

  const { email, password } = parsed.data;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return c.redirect(alertUrl("/login", "invalid-credentials"));
  }

  const valid = await verify(password, user.passwordDigest);

  if (!valid) {
    return c.redirect(alertUrl("/login", "invalid-credentials"));
  }

  const token = await sign({ userId: user.id }, JWT_SECRET);

  setCookie(c, "session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return c.redirect("/feeds");
});

// Signup page
app.get("/signup", (c) => {
  if (!REGISTRATION_ENABLED && process.env.NODE_ENV === "production") {
    return c.redirect(alertUrl("/login", "registration-disabled"));
  }

  const alert = c.req.query("alert");

  return c.html(
    <Layout alert={alert}>
      <div class="max-w-md mx-auto text-center">
        <h1 class="font-display text-3xl text-burgundy-dark mb-2">
          Create Account
        </h1>
        <p class="text-aged italic mb-8">Join our esteemed establishment</p>

        <div class="flex justify-center mb-6">
          <span class="text-gold">&#10070; &#10070; &#10070;</span>
        </div>

        <form method="post" action="/signup" class="space-y-6 text-left">
          <div>
            <label
              for="signup-email"
              class="block text-sm font-semibold text-aged uppercase tracking-wide mb-1"
            >
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              name="email"
              required
              class="w-full px-4 py-3 border-2 border-aged/30 bg-parchment focus:border-gold focus:outline-none font-body"
            />
          </div>

          <div>
            <label
              for="signup-password"
              class="block text-sm font-semibold text-aged uppercase tracking-wide mb-1"
            >
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              name="password"
              required
              minLength={8}
              class="w-full px-4 py-3 border-2 border-aged/30 bg-parchment focus:border-gold focus:outline-none font-body"
            />
          </div>

          <div>
            <label
              for="signup-password-confirmation"
              class="block text-sm font-semibold text-aged uppercase tracking-wide mb-1"
            >
              Confirm Password
            </label>
            <input
              id="signup-password-confirmation"
              type="password"
              name="password_confirmation"
              required
              minLength={8}
              class="w-full px-4 py-3 border-2 border-aged/30 bg-parchment focus:border-gold focus:outline-none font-body"
            />
          </div>

          <button
            type="submit"
            class="w-full bg-burgundy text-gold py-3 px-6 uppercase tracking-widest hover:bg-burgundy-dark cursor-pointer transition-colors border-2 border-gold"
          >
            Register
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-aged/20">
          <p class="text-aged">
            Already registered?{" "}
            <a
              href="/login"
              class="text-burgundy hover:text-burgundy-dark underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </Layout>,
  );
});

// Signup handler
app.post("/signup", async (c) => {
  if (!REGISTRATION_ENABLED && process.env.NODE_ENV === "production") {
    return c.redirect(alertUrl("/login", "registration-disabled"));
  }

  const body = await c.req.parseBody();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return c.redirect(alertUrl("/signup", "invalid-input"));
  }

  const { email, password, password_confirmation } = parsed.data;

  if (password !== password_confirmation) {
    return c.redirect(alertUrl("/signup", "passwords-mismatch"));
  }

  // Check if user exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    return c.redirect(alertUrl("/signup", "email-taken"));
  }

  const passwordDigest = await hash(password, 10);

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordDigest,
    })
    .returning();

  const token = await sign({ userId: user.id }, JWT_SECRET);

  setCookie(c, "session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return c.redirect("/feeds");
});

// Logout
app.post("/logout", (c) => {
  deleteCookie(c, "session");
  return c.redirect("/login");
});

export default app;
