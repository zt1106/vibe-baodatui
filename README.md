
# Poker Monorepo (TypeScript + Next.js + Express + Socket.IO)

Boring, agent-friendly stack for fast prototyping with unit + e2e tests.

## Project Structure

```
.
├─ apps/
│  ├─ web/                  # Next.js client
│  │  ├─ app/               # Route groups, layouts, pages
│  │  │  ├─ lobby/          # Lobby route
│  │  │  ├─ game/           # Game route
│  │  │  ├─ components/     # App-scoped components
│  │  │  └─ lib/            # App-scoped utilities
│  │  ├─ components/        # Shared UI components (e.g., cards)
│  │  ├─ tests/e2e/         # Playwright specs
│  │  ├─ public/            # Static assets
│  │  ├─ .storybook/        # Storybook config (component dev)
│  │  ├─ next.config.mjs
│  │  └─ playwright.config.ts
│  └─ server/               # Express + Socket.IO API
│     ├─ src/
│     │  ├─ infrastructure/ # Transport/adapters
│     │  ├─ __tests__/      # Vitest unit tests
│     │  └─ index.ts        # App entrypoint (HTTP + sockets)
│     ├─ prisma/
│     │  └─ schema.prisma   # Database schema
│     ├─ .env.example       # Required envs; copy to .env
│     └─ backend-architecture.md
├─ packages/
│  ├─ game-core/            # Pure game rules/state (no I/O)
│  │  └─ src/
│  │     ├─ engine.ts
│  │     ├─ cards.ts
│  │     ├─ shuffle.ts
│  │     └─ __tests__/
│  ├─ shared/               # Zod contracts + env loader
│  │  └─ src/
│  │     ├─ messages.ts
│  │     ├─ env.ts
│  │     ├─ index.ts
│  │     └─ __tests__/
│  ├─ test-utils/           # Vitest factories and helpers
│  │  └─ src/
│  │     └─ index.ts
│  ├─ core-cards/           # Card ids, layout, sizing primitives
│  │  └─ src/
│  │     ├─ ids.ts
│  │     ├─ layout.ts
│  │     ├─ sizes.ts
│  │     └─ types.ts
│  └─ ui-cards/             # React card components and variants
│     └─ src/
│        ├─ components/
│        └─ index.ts
├─ docs/                    # Design docs and notes
├─ pnpm-workspace.yaml      # Workspace packages map
├─ tsconfig.base.json       # Shared TS project refs
└─ package.json             # Root scripts
```

Notes
- Run root scripts with `pnpm` (workspace managed by `pnpm-workspace.yaml`).
- Unit tests live in `__tests__` folders; Playwright specs in `apps/web/tests/e2e`.
- Shared types/contracts and env parsing come from `packages/shared`.

## Contributor Guide
See [`AGENTS.md`](AGENTS.md) for repository conventions, key scripts, and review checklists.
