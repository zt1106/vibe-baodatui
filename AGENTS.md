# AGENTS.md – Repository agent guide

## Project overview
- TypeScript/React 18 monorepo managed by pnpm 9; Node.js 20+ recommended.
- Frontend: Next.js 14 app in `apps/web` with Storybook and Playwright for UI coverage.
- Backend: Express + Socket.IO API in `apps/server`; Prisma present for future persistence (currently in-memory).
- Shared packages: `packages/game-core` (pure poker state), `packages/core-cards` + `packages/ui-cards` (card assets/components), `packages/shared` (env + Zod contracts), `packages/test-utils` (Vitest helpers).
- Nested instructions: follow `apps/server/AGENTS.md` when touching backend code; other packages inherit these rules.

## Commands (run from repo root unless noted)
- Install deps: `pnpm install`
- Dev servers (web 3000 + api 3001): `pnpm dev`
- Build all packages: `pnpm build`
- Run all tests (Vitest): `pnpm test`
- Typecheck all projects: `pnpm typecheck`
- Playwright e2e (web): `pnpm e2e` (requires `pnpm dev` already running)
- Storybook: `pnpm sb` (dev), `pnpm sb:build` (static build)
- Per-package script: `pnpm -C apps/<name> <cmd>` or `pnpm -C packages/<name> <cmd>`

### Fast / file-scoped commands (preferred)
- Web typecheck: `pnpm -C apps/web typecheck`
- Web unit test single file: `pnpm -C apps/web test -- path/to/file.test.ts[x]`
- Server typecheck: `pnpm -C apps/server typecheck`
- Server unit test single file: `pnpm -C apps/server test -- src/__tests__/file.test.ts`
- Playwright browser install (one-time): `pnpm -C apps/web exec playwright install --with-deps`
- Prisma client after schema edits: `pnpm -C apps/server prisma:generate`
> No repo-wide lint script yet; rely on typechecks + tests for feedback.

## Testing expectations
- Unit tests: Vitest suites in `apps/server/src/__tests__`, `apps/web/tests`, and package-level `__tests__`/`*.test.ts`. Add or adjust tests with any behavior change.
- Shared helpers: reuse factories from `packages/test-utils` for socket scenarios.
- E2E: Playwright specs in `apps/web/tests/e2e`; keep `pnpm dev` running while executing `pnpm e2e`. Use `pnpm -C apps/web test:e2e:coverage` when coverage is needed.
- Coverage/unit: `pnpm -C apps/web test:unit:coverage` for web; server/package coverage via `vitest --coverage` if needed.
- Prefer targeted file-scoped runs during iteration; run `pnpm test` before opening PRs.

## Project structure & key paths
- `apps/web/app/` — Next.js client; Storybook and Playwright live in `apps/web`.
- `apps/server/src/` — Express + Socket.IO API; see `apps/server/backend-architecture.md` for module boundaries. Copy `apps/server/.env.example` to `.env` and set `DATABASE_URL`/`WEB_ORIGINS` before running.
- `packages/game-core/` — poker state machine (pure, deterministic); extend rules here first.
- `packages/core-cards/` — shared card metadata; `packages/ui-cards/` — card UI components.
- `packages/shared/` — env loader + Zod message contracts.
- `packages/test-utils/` — Vitest helpers for socket/IO scenarios.

## Code style
- TypeScript + ES modules; 2-space indentation. `camelCase` for variables/functions, `PascalCase` for React components, `UPPER_SNAKE_CASE` for constants.
- Prefer named exports and small, composable modules; keep I/O out of `packages/game-core`.
- Document non-obvious business rules with brief comments; keep comments terse.

### TypeScript examples
```ts
// ✅ Good: explicit types, guards, and pure state updates
export function assignSeat(table: TableState, userId: number, seat: number): TableState {
  if (table.seats[seat]) throw new Error("Seat already taken");
  return { ...table, seats: { ...table.seats, [seat]: { userId } } };
}

// ❌ Bad: vague names, mutates shared state, no validation
export function seat(t: any, s, u) {
  t.seats[s] = { userId: u };
  return t;
}
```

## Git & workflow
- Base branch: `main`. Keep diffs small and focused.
- Commit style: `type optional-scope: summary` (e.g., `feat: support side pots`).
- For multi-file or risky changes, propose a short plan before editing.
- Update tests/docs (including relevant AGENTS.md files) when behavior changes.

## Safety & boundaries
- ✅ Allowed: read/list files; run file-scoped typecheck/test commands; edit source/tests/docs within this repo (not generated artifacts).
- ⚠️ Ask first: adding/removing dependencies; changing database schemas or Prisma migrations; modifying CI/CD or deployment configs; altering Playwright/Storybook configs beyond test needs.
- 🚫 Never: commit secrets or credentials; edit `node_modules/`, `dist/`, coverage, or generated files; run destructive commands (`rm -rf`, `chmod` on arbitrary paths); invent new external services without a request.

## Task guidance
- Small fixes: pinpoint the minimal file, implement targeted change, update/extend nearby tests, run focused checks.
- Refactors: write a brief plan, keep steps reviewable, preserve behavior unless requested, rerun typecheck + affected tests.
- When stuck: ask clarifying questions or suggest a plan instead of broad speculative edits.

## Nested instructions
- Frontend-specific rules: `apps/web/AGENTS.md` (Next.js/Playwright/Storybook guidance).
- Backend-specific rules: `apps/server/AGENTS.md` (Express/Socket.IO/Prisma guidance).
