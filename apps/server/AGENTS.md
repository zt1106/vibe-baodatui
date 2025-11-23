# apps/server/AGENTS.md – API agent guide

## Scope & overview
- Node.js 20+, TypeScript, Express 4 + Socket.IO 4 API (port 3001 by default).
- Uses `packages/game-core` for poker rules and `packages/shared` for env + Zod contracts; runtime keeps state in memory (Prisma present for future persistence).
- Copy `apps/server/.env.example` to `.env` and set `DATABASE_URL`/`WEB_ORIGINS` before running.
- Architecture reference: `apps/server/backend-architecture.md` for boundaries and event flows. Follow root `AGENTS.md` plus the specifics below.

## Commands
- Dev server (watch): `pnpm -C apps/server dev`
- Build: `pnpm -C apps/server build`; start built bundle: `pnpm -C apps/server start`
- Tests: `pnpm -C apps/server test`
- Typecheck: `pnpm -C apps/server typecheck`
- Prisma client after schema changes: `pnpm -C apps/server prisma:generate`
- Migrations (ask first): `pnpm -C apps/server prisma:migrate`

### Fast / file-scoped commands
- Run a single test: `pnpm -C apps/server test -- src/__tests__/file.test.ts`
- Watch tests while iterating: `pnpm -C apps/server exec vitest watch src/__tests__/file.test.ts`
- Start backend only (for Playwright or Storybook work): `pnpm -C apps/server dev`

## Expectations & structure
- Tests live in `apps/server/src/__tests__`; add/update them when changing handlers or domain behavior. Reuse factories from `packages/test-utils` for socket flows.
- Keep domain/game rules in `packages/game-core`; use `packages/shared/messages` for payload schemas and type parity with the client.
- Transport handlers live in `apps/server/src/http` (REST) and `apps/server/src/socket` (WebSocket). Avoid mixing transport and domain logic; follow patterns in `backend-architecture.md` for join/auth flows.
- Server runs in-memory by default; if you introduce persistence, document the schema change, regenerate Prisma client, and add migration steps.

## Code style
- Strict TypeScript with 2-space indentation; `camelCase` for functions/variables, `UPPER_SNAKE_CASE` for constants.
- Validate inbound data with Zod before mutating state; prefer pure helpers that return updated objects over in-place mutation.
- Emit state updates through centralized helpers to keep Socket.IO broadcasts consistent.

```ts
// ✅ Good: validates input and routes through domain helpers
export function handleJoinTable(ctx: JoinContext): ServerState {
  const payload = JoinTableSchema.parse(ctx.input);
  const table = assignSeat(ctx.tables, payload.userId, payload.seat);
  return broadcastState(table, ctx.io);
}

// ❌ Bad: skips validation and mutates shared state
export function join(ctx: any) {
  ctx.tables[payload.tableId].seats[payload.seat] = payload.userId;
  ctx.io.emit("state", ctx.tables[payload.tableId]);
}
```

## Safety & boundaries
- ✅ Allowed: edit `apps/server/src` and related tests/docs; run backend tests/typechecks; adjust `packages/game-core`/`packages/shared` types used by the server.
- ⚠️ Ask first: changing Prisma schema or running migrations; adding dependencies; altering auth/Socket.IO middleware or CORS/origin settings; modifying Docker/infra files.
- 🚫 Never: commit secrets in `.env`; edit generated output (`dist/`, `node_modules/`); run destructive DB commands; bypass validation or auth in handlers without product direction.

## Task guidance
- For new endpoints or sockets, add/update Zod schemas and mirror types to the client. Extend tests to cover payload validation and broadcast results.
- Keep in-memory state consistent across HTTP + Socket.IO paths; prefer centralized helpers for seating/dealing logic.
- Ensure the backend is running via `pnpm -C apps/server dev` when running web e2e specs that rely on real socket traffic.
