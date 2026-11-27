# 0001. Modular monolith on NestJS

- Status: accepted
- Date: 2026-10-28

## Context

ledgerline orchestrates payments across external providers and records every
money movement in a double-entry ledger. The hard problems are consistency
(no money created or lost), idempotency and recovery from partial failures,
not request throughput. The project is built and operated by one person.

## Decision

- One NestJS codebase organised by domain module (`ledger`, `payments`,
  `providers`, `outbox`, `webhooks`, `reconciliation`, ...). Inside a module:
  controller, application use cases, a framework-free domain layer, and
  infrastructure adapters (Prisma repositories, provider clients).
- Two processes from the same image: `api` for HTTP and `worker` for queue
  consumers and scheduled jobs. The worker is added once there is background
  work for it.
- PostgreSQL is the source of truth. Ledger invariants are enforced by the
  database (triggers, deferred constraints, grants), not only by application
  code.
- Node.js 24 LTS. The original brief mentioned Node 22; 24 is the active LTS
  line at the time of writing and every dependency already supports it.

## Alternatives considered

- **Microservices per domain.** Would turn ledger postings and payment state
  changes into distributed transactions, which is exactly the class of bug
  this project exists to avoid. The operational cost is unjustified for one
  team.
- **Express or Fastify without a framework.** Less magic, but DI, module
  boundaries, guards, interceptors and OpenAPI generation would be rebuilt by
  hand.

## Consequences

- Module boundaries are a convention; nothing stops one module from importing
  another's internals. Reviews and a small public surface per module keep them
  honest.
- A single database simplifies atomic writes (ledger entries and outbox events
  in one transaction) but becomes the scaling limit. That is acceptable for the
  volumes this service targets.
