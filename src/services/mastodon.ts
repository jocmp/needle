const BASE_URL = "https://mastodon.social/api/v1";

export class AccountNotFound extends Error {
  constructor(message = "Account not found") {
    super(message);
    this.name = "AccountNotFound";
  }
}

export class FetchError extends Error {
  constructor(message = "Fetch error") {
    super(message);
    this.name = "FetchError";
  }
}

export type MastodonAccount = {
  id: string;
  username: string;
  display_name: string;
  url: string;
  avatar: string;
};

export type MastodonMediaAttachment = {
  id: string;
  type: "image" | "video" | "gifv" | "audio" | "unknown";
  url: string;
  preview_url?: string;
  description?: string;
};

export type MastodonStatus = {
  id: string;
  content: string;
  url: string;
  created_at: string;
  media_attachments: MastodonMediaAttachment[];
};

export async function lookupAccount(handle: string): Promise<MastodonAccount> {
  const normalized = normalizeHandle(handle);
  const url = `${BASE_URL}/accounts/lookup?acct=${encodeURIComponent(normalized)}`;

  const response = await fetch(url);

  if (response.status === 404) {
    throw new AccountNotFound();
  }

  if (!response.ok) {
    throw new FetchError(`Failed to lookup account: ${response.status}`);
  }

  return response.json();
}

export async function fetchStatuses(
  accountId: string,
  limit = 40,
): Promise<MastodonStatus[]> {
  const url = `${BASE_URL}/accounts/${accountId}/statuses?limit=${limit}&exclude_replies=true&exclude_reblogs=true`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new FetchError(`Failed to fetch statuses: ${response.status}`);
  }

  return response.json();
}

function normalizeHandle(input: string): string {
  let handle = input.trim();

  // Extract username from mastodon.social URL
  if (handle.includes("mastodon.social/@")) {
    const match = handle.match(/mastodon\.social\/@([^@\s]+)@threads\.net/);
    if (match) handle = match[1];
  }
  // Extract from threads.net or threads.com URL
  else if (/threads\.(net|com)\//.test(handle)) {
    const match = handle.match(/threads\.(?:net|com)\/@?([^/?\s]+)/);
    if (match) handle = match[1];
  } else {
    // Plain handle like @username or username@threads.net
    handle = handle.replace(/^@/, "");
    if (handle.includes("@")) {
      handle = handle.split("@")[0];
    }
  }

  return `${handle.toLowerCase()}@threads.net`;
}

export { normalizeHandle };
