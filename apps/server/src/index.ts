import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import { loadServerEnv } from '@shared/env';
import { createHeartbeatPublisher } from './infrastructure/heartbeat';
import { createLobbyRegistry } from './infrastructure/lobbyRegistry';
import { createUserRegistry } from './infrastructure/userRegistry';
import { createHttpApp, buildAllowedOrigins } from './http/app';
import { registerAuthRoutes } from './http/routes/auth';
import { registerLobbyRoutes } from './http/routes/lobby';
import { registerSystemRoutes } from './http/routes/system';
import { registerTableRoutes } from './http/routes/tables';
import { TableManager } from './domain/tableManager';
import { registerTableSocketHandlers } from './socket/tableHandlers';

const env = loadServerEnv();
const allowedOrigins = buildAllowedOrigins(env.WEB_ORIGINS);

const app = createHttpApp(allowedOrigins);
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: Array.from(allowedOrigins), credentials: true }
});

const heartbeat = createHeartbeatPublisher(io);
const users = createUserRegistry();
const lobby = createLobbyRegistry();
const tableManager = new TableManager({ io, lobby, users });

registerSystemRoutes(app, heartbeat);
registerAuthRoutes(app, users);
registerLobbyRoutes(app, lobby);
registerTableRoutes(app, { tableManager, users });

registerTableSocketHandlers(io, tableManager, heartbeat);

const stopHeartbeat = heartbeat.start();

server.listen(Number(env.PORT), () => {
  console.log(`[server] listening on http://localhost:${env.PORT}`);
});

server.on('close', stopHeartbeat);

process.once('SIGTERM', stopHeartbeat);
process.once('SIGINT', () => {
  stopHeartbeat();
  process.exit(0);
});
