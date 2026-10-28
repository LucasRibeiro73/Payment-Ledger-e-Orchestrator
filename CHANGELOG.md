# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- NestJS scaffold with strict TypeScript, ESLint, Prettier and commit hooks.
- Environment validation on boot.
- Structured JSON logging with request correlation ids.
- Liveness and readiness probes for Postgres and Redis.
- RFC 9457 problem details for every error response.
- Multi-stage Docker image, compose stack and CI pipeline.
