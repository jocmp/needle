.PHONY: dev test check fix db-setup

dev:
	bin/dev

test:
	bin/rspec

check:
	bin/rubocop -f github

fix:
	bin/rubocop -a

db-setup:
	bin/rails db:create db:migrate
