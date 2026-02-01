.PHONY: up down dev test db-setup

up:
	docker compose up -d

down:
	docker compose down

dev:
	bin/dev

test:
	bin/rspec

db-setup:
	bin/rails db:create db:migrate
