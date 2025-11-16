# Poker Monorepo (TypeScript + Next.js + Express + Socket.IO)

Boring, agent-friendly stack for fast prototyping with unit + e2e tests.

## Workspace layout

```
.
├─ AGENTS.md               # Repository conventions + Playwright workflow
├─ table-ui-plan.md        # UI layout insights and ongoing experiments
├─ apps/
│  ├─ web/
│  │  ├─ app/
│  │  ├─ components/
│  │  ├─ lib/
│  │  ├─ public/
│  │  ├─ tests/
│  │  │  └─ e2e/           # Playwright specs
│  │  ├─ test-results/     # Playwright artifacts
│  │  ├─ next.config.mjs
│  │  ├─ vitest.config.ts
│  │  ├─ playwright.config.ts
│  │  ├─ tsconfig.json
│  │  └─ package.json
│  └─ server/
│     ├─ src/
│     │  ├─ infrastructure/
│     │  ├─ __tests__/
│     │  └─ index.ts
│     ├─ prisma/
│     │  └─ schema.prisma
│     ├─ .env.example
│     ├─ AGENTS.md         # Server-specific instructions
│     ├─ backend-architecture.md
│     ├─ dist/             # Compiled output
│     ├─ package.json
│     └─ tsconfig.json
├─ packages/
│  ├─ core-cards/           # Card IDs, layout, and sizing primitives
│  ├─ game-core/            # Pure game rules + state
│  ├─ shared/               # Zod contracts & env loader
│  ├─ test-utils/           # Vitest helpers and factories
│  └─ ui-cards/             # React card variants and components
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
├─ package.json
└─ pnpm-lock.yaml
```

Notes
- Run workspace scripts with `pnpm` from the repository root (`pnpm dev`, `pnpm test`, `pnpm build`, etc.).
- Unit and Vitest suites belong in `__tests__` folders (typically under `apps/server/src` or packages); Playwright specs live in `apps/web/tests/e2e`, with artifacts under `apps/web/test-results`.
- Copy `apps/server/.env.example` to `.env` before launching the backend so Prisma has a valid `DATABASE_URL`.
- `table-ui-plan.md` captures Storybook/Playwright experiments that inform future UI decisions; update it whenever you catalog a new observation.

## Contributor Guide
See [`AGENTS.md`](AGENTS.md) for repository conventions, review checklists, and the Playwright + Storybook workflow that explains how to inspect the iframe-based UI.
