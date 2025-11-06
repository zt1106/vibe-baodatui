
# Poker Monorepo (TypeScript + Next.js + Express + Socket.IO)

Boring, agent-friendly stack for fast prototyping with unit + e2e tests.

## Quickstart
```bash
# 1) Install pnpm if you don't have it
#    macOS: corepack enable && corepack prepare pnpm@latest --activate
# 2) Install deps
pnpm install

# 3) Dev: run both web (3000) and server (3001)
pnpm dev

# 4) Unit tests (Vitest)
pnpm test

# 5) E2E (Playwright)
# First time only:
pnpm -C apps/web exec playwright install
# In one terminal:
pnpm dev
# In another:
pnpm -C apps/web test:e2e
```

## Structure
```
/apps
  /web       # Next.js app (client UI)
  /server    # Express + Socket.IO, Prisma (SQLite dev)
/packages
  /game-core # Pure TS: rules/engine, deterministic shuffle
  /shared    # zod schemas, shared types
  /test-utils# test factories/helpers
```

## Contributor Guide
See [`AGENTS.md`](AGENTS.md) for repository conventions, key scripts, and review checklists.
