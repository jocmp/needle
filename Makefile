.PHONY: up down dev test check fix deploy db-setup

up:
	docker compose up -d

down:
	docker compose down

dev:
	bin/dev

test:
	bin/rspec

check:
	bin/rubocop -f github

fix:
	bin/rubocop -a

deploy:
	flyctl deploy --remote-only

db-setup:
	bin/rails db:create db:migrate
