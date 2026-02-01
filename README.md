# Needle

RSS feeds for Threads profiles via Mastodon federation.

## Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Database**: PostgreSQL + Drizzle ORM
- **Styling**: Tailwind CSS v4
- **Deployment**: Fly.io

## Development

```bash
# Start PostgreSQL
make up

# Run migrations
make db-migrate

# Start dev server
make dev
```

## Environment

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:25432/needle_development
JWT_SECRET=your-secret-here
REGISTRATION_ENABLED=true  # Optional, for production
```

## Commands

```bash
make up           # Start PostgreSQL
make down         # Stop PostgreSQL
make dev          # Run dev server
make build        # Build CSS
make check        # Lint
make test         # Run tests
make db-generate  # Generate migrations
make db-migrate   # Run migrations
make deploy       # Deploy to Fly.io
```

## Architecture

- `src/index.tsx` - Main app entry
- `src/routes/` - Route handlers (auth, feeds, rss)
- `src/components/` - JSX components
- `src/services/` - Mastodon API, feed fetcher
- `src/worker.ts` - Background job for feed refresh (hourly)

## How it works

1. User enters a Threads handle
2. App looks up the account via Mastodon.social's API (Threads federates via ActivityPub)
3. Fetches posts and stores them as feed entries
4. Generates RSS at `/feeds/:uuid/entries.xml`
