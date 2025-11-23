# apps/web/AGENTS.md – Frontend agent guide

## Overview
- Next.js 14 + React 18 + TypeScript, Node.js 20+, pnpm workspace.
- Lives at `apps/web`; consumes shared contracts (`packages/shared`) and UI assets (`@poker/ui-cards`, `@poker/core-cards`).
- Works with the Socket.IO backend in `apps/server` (usually running on port 3001). Use `pnpm dev` at repo root to run both web and api together.

## Commands (run from repo root unless noted)
- Dev server: `pnpm -C apps/web dev` (Next.js on 3000)
- Build: `pnpm -C apps/web build`; start production build: `pnpm -C apps/web start`
- Unit tests (Vitest): `pnpm -C apps/web test` or `pnpm -C apps/web test:unit`
- Unit coverage: `pnpm -C apps/web test:unit:coverage` (outputs to `apps/web/coverage/unit`)
- Typecheck: `pnpm -C apps/web typecheck`
- Playwright e2e: `pnpm -C apps/web test:e2e` (starts dev servers if `E2E_BASE_URL` not set)
- E2E with coverage: `pnpm -C apps/web test:e2e:coverage`
- Manual bootstrap flow: `pnpm -C apps/web e2e:bootstrap-game`
- Storybook: `pnpm -C apps/web storybook`; static build: `pnpm -C apps/web build-storybook`

### Fast / file-scoped commands
- Run a single unit test: `pnpm -C apps/web test -- path/to/file.test.tsx`
- Watch a test file: `pnpm -C apps/web exec vitest watch path/to/file.test.tsx`
- Install Playwright browsers (one-time): `pnpm -C apps/web exec playwright install --with-deps`
- Provide `E2E_BASE_URL=http://localhost:3000` to reuse an already running dev server during e2e.

## Testing expectations
- Unit tests cover `app/`, `components/`, `hooks/`, `lib/`; Vitest config excludes `tests/e2e`. Setup file: `apps/web/test/setup.ts`.
- E2E specs live in `apps/web/tests/e2e`; keep `pnpm dev` (web + api) running or set `E2E_BASE_URL` to point to an existing server. Coverage output is under `apps/web/coverage`.
- Add or update tests when changing behavior or UI interactions; prefer targeted runs during iteration and run `pnpm -C apps/web test` before PRs.

## Structure & key paths
- `app/` — Next.js routes and server components.
- `components/` — UI building blocks (cards, lobby, poker tables, prepare flow). Storybook stories sit next to components.
- `hooks/` — shared React hooks.
- `lib/` — helpers/utilities.
- `public/` — static assets.
- `tests/e2e/` — Playwright specs and helpers.

## Code style
- 2-space indentation; `camelCase` for variables/functions, `PascalCase` for components, `UPPER_SNAKE_CASE` for constants.
- Prefer functional, composable components; reuse `@poker/ui-cards` and shared contracts over ad-hoc types.
- Keep state mutations immutable; co-locate small helpers next to usage when scoped to a component.

```tsx
// ✅ Good: typed props, derived values, and minimal state
export function SeatBadge({ nickname, isActive }: { nickname: string; isActive: boolean }) {
  return <span className={isActive ? 'badge badge-live' : 'badge'}>{nickname}</span>;
}

// ❌ Bad: implicit any, stringly state, inline styling
export function Badge(props) {
  return <div style={{ color: props.active ? 'green' : 'gray' }}>{props.n}</div>;
}
```

## Safety & boundaries
- ✅ Allowed: edit `app/`, `components/`, `hooks/`, `lib/`, and related tests/docs; run web tests/typechecks/storybook.
- ⚠️ Ask first: adding/removing dependencies; changing Playwright or Storybook config; altering env usage or cross-origin/socket settings; modifying shared packages beyond needed API surfaces.
- 🚫 Never: commit secrets or credentials; edit `node_modules/`, `dist/`, `coverage/`, or other generated output; bypass type safety or validations shared with the backend.

## Task guidance
- New UI or flow: update components/hooks, add Storybook coverage when reasonable, and extend Vitest/Playwright specs for interactive pieces.
- Socket/API interactions: import types/schemas from `packages/shared` to keep payloads in sync with the server.
- When running e2e locally, ensure both web (3000) and api (3001) are up; rely on `pnpm dev` or set `E2E_BASE_URL`.

