.DEFAULT_GOAL := help

.PHONY: help setup dev up down logs lint typecheck test test-int check migrate migration

help: ## List available targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "} {printf "  %-12s %s\n", $$1, $$2}'

setup: ## Install dependencies and create .env from the example
	corepack enable
	pnpm install
	test -f .env || cp .env.example .env

dev: ## Start postgres and redis, then the API in watch mode
	docker compose up -d postgres redis
	pnpm migrate:deploy
	pnpm start:dev

up: ## Build and start the whole stack
	docker compose up --build -d

down: ## Stop the stack and remove its volumes
	docker compose down -v

logs: ## Follow API logs
	docker compose logs -f api

lint: ## Run ESLint and Prettier checks
	pnpm lint
	pnpm format:check

typecheck: ## Run the TypeScript compiler without emitting
	pnpm typecheck

test: ## Run unit tests
	pnpm test

test-int: ## Run integration tests (requires Docker)
	pnpm test:int

check: lint typecheck test ## Everything CI runs before integration tests

migrate: ## Apply pending migrations
	pnpm migrate:deploy

migration: ## Create a migration from schema changes: make migration name=add_ledger
	pnpm migrate:dev --name $(name)
