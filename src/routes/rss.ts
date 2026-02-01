import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { entries, feeds } from "../db/schema";

const app = new Hono();

app.get("/:uuid/entries.xml", async (c) => {
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

  const baseUrl = new URL(c.req.url).origin;
  const handle = feed.threadsHandle.replace("@threads.net", "");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>@${handle} on Threads</title>
    <link>https://www.threads.net/@${handle}</link>
    <description>Posts from @${handle} on Threads</description>
    <atom:link href="${baseUrl}/feeds/${feed.uuid}/entries.xml" rel="self" type="application/rss+xml"/>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${feed.entries
      .map(
        (entry) => `
    <item>
      <title>${escapeXml(truncate(stripHtml(entry.content || ""), 100))}</title>
      <link>${entry.url || `https://www.threads.net/@${handle}`}</link>
      <guid isPermaLink="false">${entry.externalId}</guid>
      <pubDate>${entry.publishedAt ? new Date(entry.publishedAt).toUTCString() : ""}</pubDate>
      <description><![CDATA[${entry.content || ""}]]></description>
    </item>`,
      )
      .join("")}
  </channel>
</rss>`;

  return c.body(xml, 200, {
    "Content-Type": "application/rss+xml; charset=utf-8",
  });
});

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.substring(0, length)}...`;
}

export default app;
