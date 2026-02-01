import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { csrf } from "hono/csrf";
import { Layout } from "./components/Layout";
import { authMiddleware } from "./middleware/auth";
import authRoutes from "./routes/auth";
import feedRoutes from "./routes/feeds";
import rssRoutes from "./routes/rss";

const app = new Hono();

// Static files
app.use("/styles.css", serveStatic({ path: "./public/styles.css" }));
app.use("/icon.svg", serveStatic({ path: "./public/icon.svg" }));
app.use("/favicon.png", serveStatic({ path: "./public/favicon.png" }));
app.use("/favicon.ico", serveStatic({ path: "./public/favicon.png" }));

// CSRF protection for non-GET requests
app.use(
  csrf({
    origin: (origin, c) => {
      // No origin header = same-origin request (form submission)
      if (!origin) return true;

      const host = c.req.header("host");
      if (!host) return false;

      try {
        const originHost = new URL(origin).host;
        return originHost === host;
      } catch {
        return false;
      }
    },
  }),
);

// Auth middleware for all routes
app.use("*", authMiddleware);

// Health check
app.get("/up", (c) => c.text("OK"));

// Home page
app.get("/", (c) => {
  const user = c.get("user");

  if (user) {
    return c.redirect("/feeds");
  }

  return c.html(
    <Layout>
      <div class="text-center">
        <h1 class="font-display text-4xl text-burgundy-dark mb-4">
          Welcome to Needle
        </h1>
        <p class="text-aged italic mb-8 max-w-lg mx-auto">
          Transform thy favourite Threads correspondents into proper RSS feeds,
          delivered with the utmost elegance and reliability.
        </p>

        <div class="flex justify-center mb-8">
          <span class="text-gold">&#10070; &#10070; &#10070;</span>
        </div>

        <div class="space-y-4 max-w-md mx-auto">
          <div class="border-2 border-aged/30 p-6">
            <h2 class="font-display text-xl text-burgundy mb-2">
              How It Works
            </h2>
            <ol class="text-left text-aged space-y-2">
              <li class="flex gap-3">
                <span class="text-gold font-semibold">I.</span>
                <span>Enter a Threads handle or profile address</span>
              </li>
              <li class="flex gap-3">
                <span class="text-gold font-semibold">II.</span>
                <span>We procure the feed via Mastodon federation</span>
              </li>
              <li class="flex gap-3">
                <span class="text-gold font-semibold">III.</span>
                <span>Subscribe in thy preferred RSS reader</span>
              </li>
            </ol>
          </div>

          <a
            href="/signup"
            class="block bg-burgundy text-gold py-3 px-6 uppercase tracking-widest hover:bg-burgundy-dark transition-colors border-2 border-gold"
          >
            Begin Thy Journey
          </a>

          <p class="text-aged text-sm">
            Already a patron?{" "}
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

// Mount routes (RSS first - it's public, no auth required)
app.route("/", authRoutes);
app.route("/feeds", rssRoutes);
app.route("/feeds", feedRoutes);

// 404 handler
app.notFound((c) => {
  const user = c.get("user");

  return c.html(
    <Layout user={user}>
      <div class="text-center py-12">
        <h1 class="font-display text-4xl text-burgundy-dark mb-4">
          Page Not Found
        </h1>
        <p class="text-aged italic mb-8">
          Alas, the page thou seekest cannot be located.
        </p>
        <a href="/" class="text-burgundy hover:text-burgundy-dark underline">
          Return to the homepage
        </a>
      </div>
    </Layout>,
    404,
  );
});

const port = Number(process.env.PORT) || 3000;

console.log(`Server running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
