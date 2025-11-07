# Repository Guidelines

## Project Structure & Module Organization
This workspace is managed by pnpm (`pnpm-workspace.yaml`) with applications and shared packages grouped at the root.
- `apps/web`: Next.js client in `app/`; Playwright specs live under `tests/e2e`.
- `apps/server`: Express + Socket.IO API; Prisma schema in `prisma/schema.prisma`; Vitest suites in `src/__tests__`.
- `packages/game-core`: Pure game state utilities with no I/O dependencies.
- `packages/shared`: Shared env loader and Zod message contracts.
- `packages/test-utils`: Helpers reused across Vitest suites.

## Build, Test, and Development Commands
Run commands from the repository root unless noted.
- `pnpm install`: hoist workspace dependencies.
- `pnpm dev`: start the server (`PORT` defaults to 3001) and web app (3000) concurrently.
- `pnpm build`: build every workspace package for production output.
- `pnpm test`: execute all Vitest suites across apps and packages.
- `pnpm typecheck`: run the TypeScript project references.
- `pnpm e2e`: launch Playwright end-to-end specs for the web experience.
  - First-time setup in CI or fresh containers requires Playwright browsers. Run `pnpm -C apps/web exec playwright install --with-deps` once to provision Chromium/Firefox/WebKit and system deps before executing the suite.
  - The Playwright specs assume the Next.js client and Express API are already running. Start them with `pnpm dev` in another terminal and keep the process alive while `pnpm e2e` runs.
Target individual scripts with `pnpm -C apps/<name> <script>` (for example, `pnpm -C apps/server prisma:generate`).

## Coding Style & Naming Conventions
TypeScript is standard with ES module syntax. Use two-space indentation and `camelCase` for variables, functions, and file names; reserve `UPPER_SNAKE_CASE` for shared constants. Prefer named exports and keep feature logic small and composable (see `packages/game-core`). Document non-obvious business rules with brief comments. There is no lint script yet, so rely on TypeScript checks and Vitest to enforce structure.

## Testing Guidelines
Vitest drives unit coverage; place specs in `__tests__` folders with a `*.test.ts` suffix. Reuse factories from `packages/test-utils` for socket scenarios. Playwright powers end-to-end coverage in `apps/web/tests/e2e`; group scenarios by table size or flow (`2players.spec.ts`). Before pushing, run `pnpm test && pnpm e2e`; during iteration, narrow scope with `pnpm -C apps/server test` or `pnpm -C apps/web test`.

## Commit & Pull Request Guidelines
Existing history uses concise, imperative subject lines (“Add initial README…”). Follow `type optional-scope: subject` when it clarifies intent (`feat: support side pots`). Reference issue IDs and describe noteworthy design choices, schema changes, or env additions in the body. Pull requests should include: a behaviour summary, screenshots or terminal captures for user-facing changes, test results (Vitest/Playwright), and any follow-up TODOs.

## Environment & Configuration
Copy `apps/server/.env.example` to `.env` before running the backend; Prisma expects a valid `DATABASE_URL`. After schema edits run `pnpm -C apps/server prisma:generate` and apply migrations with `pnpm -C apps/server prisma:migrate`. Keep secrets out of source control and update the deployment secret store instead.
