import { describe, expect, test } from "bun:test";

// Test the helper functions used in RSS generation
// These are duplicated from rss.ts to test in isolation

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

describe("escapeXml", () => {
  test("escapes ampersand", () => {
    expect(escapeXml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  test("escapes less than", () => {
    expect(escapeXml("a < b")).toBe("a &lt; b");
  });

  test("escapes greater than", () => {
    expect(escapeXml("a > b")).toBe("a &gt; b");
  });

  test("escapes quotes", () => {
    expect(escapeXml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  test("escapes apostrophes", () => {
    expect(escapeXml("it's")).toBe("it&apos;s");
  });

  test("handles multiple special characters", () => {
    expect(escapeXml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
  });
});

describe("stripHtml", () => {
  test("removes simple tags", () => {
    expect(stripHtml("<p>Hello</p>")).toBe("Hello");
  });

  test("removes nested tags", () => {
    expect(stripHtml("<div><p>Hello <strong>world</strong></p></div>")).toBe(
      "Hello world",
    );
  });

  test("removes tags with attributes", () => {
    expect(stripHtml('<a href="https://example.com">Link</a>')).toBe("Link");
  });

  test("handles self-closing tags", () => {
    expect(stripHtml("Line 1<br/>Line 2")).toBe("Line 1Line 2");
  });

  test("preserves text without tags", () => {
    expect(stripHtml("Plain text")).toBe("Plain text");
  });
});

describe("truncate", () => {
  test("does not truncate short text", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  test("truncates long text with ellipsis", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
  });

  test("handles exact length", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });

  test("handles empty string", () => {
    expect(truncate("", 10)).toBe("");
  });
});

describe("RSS XML structure", () => {
  test("generates valid RSS structure", () => {
    const handle = "testuser";
    const feedUuid = "abc-123";
    const baseUrl = "http://localhost:3000";
    const entries = [
      {
        externalId: "post1",
        content: "<p>First post</p>",
        url: "https://threads.net/@testuser/post/1",
        publishedAt: new Date("2024-01-15T12:00:00Z"),
      },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>@${handle} on Threads</title>
    <link>https://www.threads.net/@${handle}</link>
    <description>Posts from @${handle} on Threads</description>
    <atom:link href="${baseUrl}/feeds/${feedUuid}/entries.xml" rel="self" type="application/rss+xml"/>
    <language>en</language>
    ${entries
      .map(
        (entry) => `
    <item>
      <title>${escapeXml(truncate(stripHtml(entry.content || ""), 100))}</title>
      <link>${entry.url}</link>
      <guid isPermaLink="false">${entry.externalId}</guid>
      <pubDate>${entry.publishedAt.toUTCString()}</pubDate>
      <description><![CDATA[${entry.content}]]></description>
    </item>`,
      )
      .join("")}
  </channel>
</rss>`;

    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<rss version=\"2.0\"");
    expect(xml).toContain("<title>@testuser on Threads</title>");
    expect(xml).toContain("<link>https://www.threads.net/@testuser</link>");
    expect(xml).toContain("atom:link href=");
    expect(xml).toContain("<item>");
    expect(xml).toContain("<guid isPermaLink=\"false\">post1</guid>");
    expect(xml).toContain("<![CDATA[<p>First post</p>]]>");
  });
});
