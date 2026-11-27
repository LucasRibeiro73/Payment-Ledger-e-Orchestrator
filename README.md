# ledgerline

[![CI](https://github.com/LucasRibeiro73/Payment-Ledger-e-Orchestrator/actions/workflows/ci.yml/badge.svg)](https://github.com/LucasRibeiro73/Payment-Ledger-e-Orchestrator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Payment orchestration API with an immutable double-entry ledger, provider
failover and settlement reconciliation.

> Work in progress. The foundation (config, logging, health, errors, Docker,
> CI) is in place; the ledger and payment flows are being built in phases.

## The problem

Moving money through third-party providers fails in untidy ways: timeouts
after the provider already charged the card, webhooks delivered twice,
settlement files that disagree with your records. ledgerline is a reference
implementation of the patterns that keep the books correct anyway:
double-entry bookkeeping enforced by the database, idempotent APIs, a
transactional outbox and daily reconciliation.

## Stack

| Concern       | Choice                       | Why                                                |
| ------------- | ---------------------------- | -------------------------------------------------- |
| Runtime       | Node.js 24 LTS, TypeScript 6 | Current LTS; strict typing across the codebase     |
| Framework     | NestJS 12                    | DI and module boundaries for a modular monolith    |
| Database      | PostgreSQL 18, Prisma 7      | Transactions and constraints that guard the ledger |
| Queue / cache | Redis 8                      | Rate limiting now, background jobs later           |
| Tests         | Vitest, Testcontainers       | Fast unit runs, integration tests on real Postgres |
| Observability | pino, terminus               | JSON logs with correlation ids, health probes      |

The reasoning behind the main decisions lives in [docs/adr](docs/adr).

## Running locally

Requires Docker.

```bash
docker compose up --build
curl -i http://localhost:3000/health/ready
```

For development with hot reload (Node 24, pnpm through corepack):

```bash
make setup   # install dependencies, create .env
make dev     # start postgres and redis, run the API in watch mode
```

## Testing

```bash
make check      # lint, format, typecheck, unit tests
make test-int   # integration tests against Testcontainers
```

## Errors

Every error is an [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) problem
document carrying the request id that also appears in the logs:

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Cannot GET /nope",
  "instance": "/nope",
  "requestId": "1e8fc428-bb52-4880-bac2-fb80b42fafcc"
}
```

## Roadmap

- [x] Foundation: config, logging, health, errors, Docker, CI
- [ ] Immutable double-entry ledger enforced in Postgres
- [ ] Payment state machine
- [ ] Idempotency keys
- [ ] Provider routing, circuit breaker, timeout recovery
- [ ] Transactional outbox, workers, retries, dead-letter queue
- [ ] Signed webhooks
- [ ] Settlement reconciliation
- [ ] Metrics, tracing, hardening, load test

## License

[MIT](LICENSE)
