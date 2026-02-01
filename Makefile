.PHONY: dev test check db-setup

dev:
	bin/dev

test:
	bin/rspec

check:
	bin/rubocop -f github

db-setup:
	bin/rails db:create db:migrate
