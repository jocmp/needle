.PHONY: dev build check fix test deploy up down db-generate db-migrate

up:
	docker compose up -d

down:
	docker compose down

dev:
	bun run dev

build:
	bun run build

check:
	bun run check

fix:
	bun run check

test:
	bun test

db-generate:
	bun run db:generate

db-migrate:
	bun run db:migrate

deploy:
	flyctl deploy --remote-only
