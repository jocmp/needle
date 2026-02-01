.PHONY: dev build check test deploy up down db-generate db-migrate db-studio

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

test:
	bun test

db-generate:
	bun run db:generate

db-migrate:
	bun run db:migrate

db-studio:
	bun run db:studio

deploy:
	flyctl deploy --remote-only
