import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { Layout } from "../components/Layout";
import { db } from "../db";
import { entries, feeds, subscriptions } from "../db/schema";
import { alertUrl } from "../lib/alerts";
import { type User, requireAuth } from "../middleware/auth";
import { refreshFeed } from "../services/feed-fetcher";
import {
  AccountNotFound,
  FetchError,
  lookupAccount,
  normalizeHandle,
} from "../services/mastodon";

const createFeedSchema = z.object({
  handle: z.string().min(1),
});

const app = new Hono<{ Variables: { user: User } }>();

app.use("*", requireAuth);

// List feeds
app.get("/", async (c) => {
  const user = c.get("user") as User;
  const notice = c.req.query("notice");

  const userSubscriptions = await db.query.subscriptions.findMany({
    where: eq(subscriptions.userId, user.id),
    with: {
      feed: {
        with: {
          entries: {
            limit: 1,
            orderBy: [desc(entries.publishedAt)],
          },
        },
      },
    },
  });

  const userFeeds = userSubscriptions.map((s) => s.feed);

  return c.html(
    <Layout user={user} notice={notice}>
      <div class="text-center mb-8">
        <h1 class="font-display text-3xl text-burgundy-dark mb-2">
          Thy Feed Collection
        </h1>
        <p class="text-aged italic">
          A curated selection of Threads correspondents
        </p>
      </div>

      <div class="flex justify-center mb-8">
        <a
          href="/feeds/new"
          class="bg-burgundy text-gold py-2 px-6 uppercase tracking-widest hover:bg-burgundy-dark transition-colors border-2 border-gold"
        >
          Acquire New Feed
        </a>
      </div>

      {userFeeds.length === 0 ? (
        <div class="text-center py-12 text-aged italic">
          <p>Thy collection is empty.</p>
          <p class="mt-2">Acquire a feed to begin.</p>
        </div>
      ) : (
        <div class="space-y-4">
          {userFeeds.map((feed) => (
            <div
              key={feed.uuid}
              class="border-2 border-aged/20 p-4 bg-parchment/50 hover:border-gold transition-colors"
            >
              <div class="flex justify-between items-start">
                <div class="flex gap-4">
                  {feed.avatarUrl && (
                    <img
                      src={feed.avatarUrl}
                      alt=""
                      class="w-12 h-12 rounded-full border-2 border-aged/30"
                    />
                  )}
                  <div>
                    <a
                      href={`/feeds/${feed.uuid}`}
                      class="font-display text-xl text-burgundy-dark hover:text-burgundy"
                    >
                      @{feed.threadsHandle.replace("@threads.net", "")}
                    </a>
                    <p class="text-aged text-sm mt-1">
                      {feed.entries[0]?.publishedAt
                        ? `Latest: ${new Date(feed.entries[0].publishedAt).toLocaleDateString()}`
                        : "No entries yet"}
                    </p>
                  </div>
                </div>
                <div class="flex gap-4">
                  <a
                    href={`/feeds/${feed.uuid}/entries.xml`}
                    class="text-gold hover:text-gold-light text-sm uppercase tracking-wide"
                  >
                    RSS
                  </a>
                  <form method="post" action={`/feeds/${feed.uuid}/delete`}>
                    <button
                      type="submit"
                      class="text-burgundy/60 hover:text-burgundy text-sm uppercase tracking-wide"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>,
  );
});

// New feed form
app.get("/new", (c) => {
  const user = c.get("user") as User;
  const alert = c.req.query("alert");

  return c.html(
    <Layout user={user} alert={alert}>
      <div class="max-w-lg mx-auto text-center">
        <h1 class="font-display text-3xl text-burgundy-dark mb-2">
          Acquire a Threads Feed
        </h1>
        <p class="text-aged italic mb-8">
          Furnish us with the handle of thy desired correspondent
        </p>

        <div class="flex justify-center mb-6">
          <span class="text-gold">&#10070; &#10070; &#10070;</span>
        </div>

        <form method="post" action="/feeds" class="space-y-6 text-left">
          <div>
            <label
              for="handle"
              class="block text-sm font-semibold text-aged uppercase tracking-wide mb-1"
            >
              Threads Handle or Address
            </label>
            <input
              id="handle"
              type="text"
              name="handle"
              required
              placeholder="@username or https://www.threads.net/@username"
              class="w-full px-4 py-3 border-2 border-aged/30 bg-parchment focus:border-gold focus:outline-none font-body"
            />
            <p class="mt-2 text-aged/70 text-sm italic">
              e.g., @zuck or the full Threads profile address
            </p>
          </div>

          <button
            type="submit"
            class="w-full bg-burgundy text-gold py-3 px-6 uppercase tracking-widest hover:bg-burgundy-dark cursor-pointer transition-colors border-2 border-gold"
          >
            Procure This Feed
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-aged/20">
          <p class="text-aged">
            <a
              href="/feeds"
              class="text-burgundy hover:text-burgundy-dark underline"
            >
              Return to thy collection
            </a>
          </p>
        </div>
      </div>
    </Layout>,
  );
});

// Create feed
app.post("/", async (c) => {
  const user = c.get("user") as User;
  const body = await c.req.parseBody();
  const parsed = createFeedSchema.safeParse(body);

  if (!parsed.success) {
    return c.redirect(alertUrl("/feeds/new", "invalid-handle"));
  }

  const handle = normalizeHandle(parsed.data.handle);

  try {
    // Check if feed already exists
    let feed = await db.query.feeds.findFirst({
      where: eq(feeds.threadsHandle, handle),
    });

    if (!feed) {
      // Lookup account on Mastodon
      const account = await lookupAccount(handle);

      // Create feed
      const [newFeed] = await db
        .insert(feeds)
        .values({
          threadsHandle: handle,
          mastodonId: account.id,
          avatarUrl: account.avatar,
        })
        .returning();

      feed = newFeed;

      // Fetch initial entries
      await refreshFeed(feed);
    }

    // Check if user already subscribed
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.feedId, feed.id),
      ),
    });

    if (!existingSubscription) {
      await db.insert(subscriptions).values({
        userId: user.id,
        feedId: feed.id,
      });
    }

    return c.redirect("/feeds?notice=Feed+added+successfully");
  } catch (error) {
    if (error instanceof AccountNotFound) {
      return c.redirect(alertUrl("/feeds/new", "account-not-found"));
    }
    if (error instanceof FetchError) {
      return c.redirect(alertUrl("/feeds/new", "feed-error"));
    }
    throw error;
  }
});

// Show feed
app.get("/:uuid", async (c) => {
  const user = c.get("user") as User;
  const uuid = c.req.param("uuid");

  const feed = await db.query.feeds.findFirst({
    where: eq(feeds.uuid, uuid),
    with: {
      entries: {
        orderBy: [desc(entries.publishedAt)],
        limit: 50,
      },
    },
  });

  if (!feed) {
    return c.notFound();
  }

  // Check if user is subscribed
  const subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, user.id),
      eq(subscriptions.feedId, feed.id),
    ),
  });

  if (!subscription) {
    return c.notFound();
  }

  return c.html(
    <Layout user={user}>
      <div class="mb-8">
        <div class="flex justify-between items-start">
          <div class="flex gap-4">
            {feed.avatarUrl && (
              <img
                src={feed.avatarUrl}
                alt=""
                class="w-16 h-16 rounded-full border-2 border-aged/30"
              />
            )}
            <div>
              <h1 class="font-display text-3xl text-burgundy-dark">
                @{feed.threadsHandle.replace("@threads.net", "")}
              </h1>
              <p class="text-aged italic mt-1">
                {feed.entries.length} entries in collection
              </p>
            </div>
          </div>
          <div class="flex gap-4">
            <a
              href={`/feeds/${feed.uuid}/entries.xml`}
              class="bg-gold text-burgundy-dark py-2 px-4 uppercase tracking-wide text-sm hover:bg-gold-light transition-colors"
            >
              RSS Feed
            </a>
            <form method="post" action={`/feeds/${feed.uuid}/refresh`}>
              <button
                type="submit"
                class="border-2 border-gold text-gold py-2 px-4 uppercase tracking-wide text-sm hover:bg-gold/10 transition-colors"
              >
                Refresh
              </button>
            </form>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        {feed.entries.map((entry) => (
          <article key={entry.externalId} class="border-b border-aged/20 pb-6">
            <div
              class="prose prose-burgundy max-w-none"
              // biome-ignore lint: dangerouslySetInnerHTML is needed for HTML content
              dangerouslySetInnerHTML={{ __html: entry.content || "" }}
            />
            <div class="mt-3 text-sm text-aged">
              {entry.publishedAt && (
                <time>
                  {new Date(entry.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
              )}
              {entry.url && (
                <>
                  {" "}
                  &middot;{" "}
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-burgundy hover:underline"
                  >
                    View on Threads
                  </a>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      <div class="mt-8 pt-6 border-t border-aged/20 text-center">
        <a
          href="/feeds"
          class="text-burgundy hover:text-burgundy-dark underline"
        >
          Return to thy collection
        </a>
      </div>
    </Layout>,
  );
});

// Refresh feed
app.post("/:uuid/refresh", async (c) => {
  const user = c.get("user") as User;
  const uuid = c.req.param("uuid");

  const feed = await db.query.feeds.findFirst({
    where: eq(feeds.uuid, uuid),
  });

  if (!feed) {
    return c.notFound();
  }

  // Check subscription
  const subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, user.id),
      eq(subscriptions.feedId, feed.id),
    ),
  });

  if (!subscription) {
    return c.notFound();
  }

  try {
    await refreshFeed(feed);
    return c.redirect(`/feeds/${uuid}?notice=Feed+refreshed`);
  } catch {
    return c.redirect(alertUrl(`/feeds/${uuid}`, "refresh-error"));
  }
});

// Delete subscription
app.post("/:uuid/delete", async (c) => {
  const user = c.get("user") as User;
  const uuid = c.req.param("uuid");

  const feed = await db.query.feeds.findFirst({
    where: eq(feeds.uuid, uuid),
  });

  if (!feed) {
    return c.notFound();
  }

  await db
    .delete(subscriptions)
    .where(
      and(eq(subscriptions.userId, user.id), eq(subscriptions.feedId, feed.id)),
    );

  return c.redirect("/feeds?notice=Unsubscribed+from+feed");
});

export default app;
