import { eq } from "drizzle-orm";
import { db } from "../db";
import { entries, feeds } from "../db/schema";
import { fetchStatuses, lookupAccount } from "./mastodon";

type Feed = typeof feeds.$inferSelect;

export async function refreshFeed(feed: Feed): Promise<void> {
  if (!feed.mastodonId) {
    console.log(`Feed ${feed.threadsHandle} has no mastodon ID, skipping`);
    return;
  }

  const account = await lookupAccount(feed.threadsHandle);
  await db
    .update(feeds)
    .set({ avatarUrl: account.avatar })
    .where(eq(feeds.id, feed.id));

  const statuses = await fetchStatuses(feed.mastodonId);

  for (const status of statuses) {
    // Check if entry already exists
    const existing = await db.query.entries.findFirst({
      where: eq(entries.externalId, status.id),
    });

    if (existing) continue;

    await db.insert(entries).values({
      feedId: feed.id,
      externalId: status.id,
      content: status.content,
      url: status.url,
      publishedAt: new Date(status.created_at),
    });
  }
}

export async function refreshAllFeeds(): Promise<void> {
  const allFeeds = await db.query.feeds.findMany();

  for (const feed of allFeeds) {
    try {
      await refreshFeed(feed);
      console.log(`Refreshed feed: ${feed.threadsHandle}`);
    } catch (error) {
      console.error(`Failed to refresh feed ${feed.threadsHandle}:`, error);
    }
  }
}
