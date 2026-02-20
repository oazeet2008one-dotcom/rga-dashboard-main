# RGA Toolkit v2.0 - Developer CLI

## Quick Start

```bash
npm run toolkit
```

## Current State

- Single interactive entrypoint: `npm run toolkit` (root alias to backend `dev:toolkit`)
- Deterministic script entrypoints:
  - `npm run toolkit:smoke`
  - `npm run toolkit:preflight`
  - `npm run toolkit:seed-scenario`
  - `npm run toolkit:verify-scenario`
  - `npm run toolkit:check:overview-contract`
- Deterministic `toolkit:*` scripts run via isolated schema wrapper by default (`TOOLKIT_ISOLATED_SCHEMA`, default `toolkit_dev`)
- Runtime contract for isolated toolkit scripts is Node `v20.x` (`.nvmrc`); commands auto-fallback via `npx node@20` when local runtime differs
- Safety policy is fail-closed via manifest pipeline and DB host gates

## High-Level Structure

```text
src/toolkit/
  cli.ts                  interactive entrypoint
  core/                   contracts, DI, configuration, policies
  commands/               command handlers
  manifest/               run manifest + safety gate pipeline
  scripts/                non-interactive deterministic entrypoints
  services/               toolkit domain services
```

## Development Notes

1. Add new command DTO/handler under `src/toolkit/commands/`.
2. Register handler in `src/toolkit/cli.ts`.
3. Add deterministic script coverage if command must run in CI.
4. Add or extend tests in `src/toolkit/__tests__`, `src/toolkit/test`, or `src/toolkit/manifest/__tests__`.
