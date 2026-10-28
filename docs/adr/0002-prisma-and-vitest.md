# 0002. Prisma for data access, Vitest for tests

- Status: accepted
- Date: 2026-10-28

## Context

The service needs typed database access, versioned migrations and the ability
to drop to raw SQL for things an ORM does not model well: triggers,
`SELECT ... FOR UPDATE SKIP LOCKED`, deferred constraints. Tests must cover
pure domain rules quickly and run integration suites against a real Postgres.

## Decision

- **Prisma 7** with the `prisma-client` generator and the `pg` driver adapter.
  Schema changes go through `prisma migrate`; invariants that Prisma cannot
  express are written as SQL inside those migrations. Domain code never
  imports Prisma types.
- Prisma is pinned to the latest stable 7.x. The `latest` npm tag pointed to
  an 8.0 release candidate when this was written.
- **Vitest** with `unplugin-swc`. Unit tests live next to the code
  (`*.spec.ts`); integration tests (`*.int-spec.ts`) run in a separate Vitest
  project against Testcontainers.
- **TypeScript 6.0**. TypeScript 7 (the native compiler) is out, but
  typescript-eslint does not support it yet, and type-aware linting matters
  more here than compile speed.

## Alternatives considered

- **TypeORM or MikroORM.** Richer entity mapping, but entity classes tend to
  leak persistence concerns into the domain, and generated migrations are less
  predictable than Prisma's plain SQL files.
- **Jest**, the Nest default. Works, but needs ts-jest or SWC anyway, starts
  slower and has weaker ESM support.

## Consequences

- Vite's default transformer drops decorator metadata, so SWC is required for
  Nest dependency injection in tests. That is one more plugin to maintain.
- Raw SQL in migrations is invisible to Prisma's schema diffing; integration
  tests are what prove the triggers and constraints work.
