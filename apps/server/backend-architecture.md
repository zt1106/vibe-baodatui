# Backend Architecture

This document captures the current and target-state backend architecture for the poker experience. It describes how the Node.js game server is organized today, the infrastructure we rely on, and the roadmap for evolving from an in-memory prototype to a production-ready multi-table environment.

## Design Goals

- Support fast, low-latency real-time updates for interactive gameplay.
- Keep the core game rules deterministic and reusable across transports (web, mobile, future bots).
- Favor clear boundaries between transport concerns, domain logic, and persistence.
- Scale from a single process to multiple regions without code rewrites.
- Provide reliable operational insight (logs, metrics, health signals) for on-call teams.

## High-Level System Overview

- **Clients (Next.js app, future native apps)** connect over HTTPS and Socket.IO.
- **API Gateway (Express)** provides RESTful endpoints for health checks, future auth, and command triggers.
- **Real-time Hub (Socket.IO)** manages rooms, event fan-out, and backpressure control.
- **Game Engine (`packages/game-core`)** encapsulates pure poker state transitions (deck, bets, seats).
- **Shared Contracts (`packages/shared`)** enforce schema parity between client and server via Zod.
- **In-memory Table Registry** tracks active seats, chip stacks, and hands within each server process.
- **Optional Infra Services (Redis, message broker, object storage)** can be added later for cross-process scaling and replay.

```
Clients ──HTTP──▶ Express API ──▶ Controllers ──▶ Game Engine
        ╲        ╱                   │
         ╲────WebSocket──── Socket.IO Hub ───▶ In-memory Table Registry
```

## Runtime Stack

- **Language & Runtime**: Node.js 20+, TypeScript-first (strict mode), ES modules across packages.
- **Frameworks**: Express 4 for HTTP routes, Socket.IO 4 for WebSocket transport with fallback support.
- **Process Manager**: `tsx` for local dev hot reload; production runs under a supervisor such as `pm2`, Docker, or orchestrated K8s pods.
- **State Storage**: All gameplay data resides in-memory; restarts reset tables, and there is no external database dependency.
- **Configuration**: `.env` sourced via `packages/shared/env`, ensuring consistent variable parsing on server and client builds.

## Module Responsibilities

### Express Application (`apps/server/src/index.ts`)

- Boots the HTTP server and attaches Socket.IO.
- Defines lightweight REST endpoints (`/health`, future `/auth`, `/admin`).
- Bridges incoming WebSocket events to domain services.

### Game Engine (`packages/game-core`)

- Pure, deterministic functions for table lifecycle: `createTable`, `joinTable`, `deal`, `bet`.
- Operates on serializable `TableState`; no network or I/O dependencies.
- Enables deterministic testing with seeded shuffles and reproducible hands.

### Shared Contracts (`packages/shared/messages.ts`)

- Zod schemas for events (`JoinTable`, `Bet`, `ServerState`) to validate runtime payloads.
- Mirror types exported for client consumption to guarantee symmetry and shrink drift risk.

### In-memory State Store

- Table registry managed by the Socket.IO server thread.
- Player seating, chip counts, decks, and pots live in process-scoped maps keyed by table id.
- Optional snapshot hooks can serialize state to disk for debugging, but no persistence is required today.

### Background Workers

- Matchmaking, scheduled tournaments, and fraud detection run as separate worker processes.
- Communicate through Redis streams, NATS, or BullMQ to keep the web tier responsive.

## Request and Event Flows

1. **Handshake**
   - Client hits `GET /health` for readiness.
   - Socket.IO connection established; server emits `state` snapshot with current table info.
2. **Join Table**
   - Client emits `joinTable { nickname }`.
   - Server validates payload via Zod, mutates table state (`joinTable` + `deal` for demo).
   - Updated `ServerState` broadcast to all subscribers.
3. **Betting**
   - Client emits `bet { chips }`.
   - Server validates, delegates to `coreBet`, updates pot, and records action in-memory for the current hand.
   - Broadcast new `ServerState`; failures trigger `errorMessage`.
4. **Disconnect**
   - Socket.IO detects disconnect; cleanup worker reclaims seat after timeout and notifies table occupants.

Future flows will extend this template for folds, showdowns, and tournament phases.

## Data & State Management

- **Active State**: Each table lives entirely in-process using the `TableState` map exported by `packages/game-core`.
- **Ephemeral Nature**: Server restarts wipe state. Acceptable for prototype/testing environments; persistence is a roadmap item.
- **Optional Replication**: Redis or another pub/sub system can be introduced later to replicate state across nodes if horizontal scaling is required.
- **Event Sourcing (future)**: Append-only action logs may be adopted to retain hand history once persistence is prioritized.

## Scaling Strategy

- **Horizontal Scaling**: Initially run a single Socket.IO node. When multiple nodes are needed, add the Redis adapter (or another message bus) to synchronize in-memory tables.
- **Room Sharding**: Allocate groups of tables per process; promote hot tables to dedicated pods if contention appears.
- **State Offloading**: For larger tournaments, dedicated game workers can own table state and communicate via RPC without storing to disk.
- **Backpressure & Rate Limiting**: Apply Socket.IO middleware to throttle abusive clients; enforce per-IP and per-user caps at the ingress layer.
- **Global Distribution**: Multi-region deployments rely on CDN for static assets, regional Socket.IO clusters, and geo-aware routing; durability remains a future enhancement.

## Deployment & Operations

- **Environments**: `dev`, `staging`, `prod` share the same in-memory profile—no external database provisioning required.
- **Containerization**: Dockerfile bundles the server; CI builds and pushes images to registry. Runtime configured via environment variables.
- **Orchestration**: Kubernetes or ECS schedules pods, mounts config, and manages horizontal pod autoscaling on CPU/WebSocket count.
- **Observability**:
  - Structured logging (`pino` or `winston`) with correlation IDs per table and hand.
  - Metrics emitted via `prom-client` (active connections, average latency, errors).
  - Tracing (OpenTelemetry) for join/bet flows to spot latency spikes.
- **Health & Readiness**: `/health` (basic) plus `/ready` (ensures event loop, memory, and Socket.IO health) gate traffic in load balancers.
- **Disaster Recovery**: With in-memory state, hand history resets on restart; future persistence will introduce backup strategies.

## Security Considerations

- JWT-based authentication issued by the web app; middleware ensures only authenticated sockets can join tables.
- Role-based authorization for admin endpoints (table moderation, chip grants).
- Input validation everywhere via Zod; sanitize untrusted strings before logging.
- Transport security through HTTPS + WSS; enforce TLS 1.2+ and secure cookies for session identifiers.
- DDoS mitigation using WAF rules, connection quotas, and exponential backoff retries.

## Testing & Quality

- **Unit Tests**: `pnpm -r test` runs Vitest suites across packages. Critical to cover game engine edge cases (illegal bets, deck exhaustion).
- **Integration Tests**: Socket.IO client simulations (Vitest + `socket.io-client`) validate join/bet flows end-to-end.
- **Load Testing**: K6 or Artillery scenarios exercise hundreds of concurrent players; watch for GC pressure and latency.
- **Chaos Testing**: Introduce network partitions and process restarts to verify reconnection logic and state reconciliation.

## Roadmap & Enhancements

- Introduce durable storage (e.g., PostgreSQL via Prisma) for hand history, analytics, and persistence.
- Add matchmaker service supporting table capacity rules and skill-based seeding.
- Implement side pots, blinds rotation, and showdown logic in `packages/game-core`.
- Support multi-table tournaments with scheduling via background workers.
- Introduce moderation tooling (real-time spectating, hand history exports).

## Appendix: Reference Commands

- `pnpm dev` — start web + server in watch mode.
- `pnpm -C apps/server build` — output production bundle for containerization.
- `pnpm test && pnpm e2e` — run unit and Playwright suites before deployment.
