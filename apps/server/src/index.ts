import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import { loadServerEnv } from '@shared/env';
import type { ClientToServerEvents, ServerToClientEvents } from '@shared/events';
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
import { AutoPlayBot } from './bots/autoPlayBot';
import { setDealDelayMs } from './domain/tableManager';

type ServerCliFlags = {
  autoPlay: boolean;
  port?: string;
};

function parseServerFlags(argv: string[]): ServerCliFlags {
  const flags: ServerCliFlags = { autoPlay: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--auto-play') {
      flags.autoPlay = true;
      continue;
    }
    if ((arg === '--port' || arg === '-p') && argv[i + 1]) {
      flags.port = argv[i + 1];
      i += 1;
    }
  }
  return flags;
}

const flags = parseServerFlags(process.argv.slice(2));
if (flags.port) {
  process.env.PORT = flags.port;
}

const env = loadServerEnv();
const allowedOrigins = buildAllowedOrigins(env.WEB_ORIGINS);

const app = createHttpApp(allowedOrigins);
const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: { origin: Array.from(allowedOrigins), credentials: true }
});

const heartbeat = createHeartbeatPublisher(io);
const users = createUserRegistry();
const lobby = createLobbyRegistry();
const tableManager = new TableManager({ io, lobby, users });
const autoPlayBot = flags.autoPlay ? new AutoPlayBot(tableManager) : null;
if (flags.autoPlay) {
  setDealDelayMs(100);
}

registerSystemRoutes(app, heartbeat);
registerAuthRoutes(app, users);
registerLobbyRoutes(app, lobby);
registerTableRoutes(app, { tableManager, users });

registerTableSocketHandlers(io, tableManager, heartbeat);

const stopHeartbeat = heartbeat.start();
if (autoPlayBot) {
  autoPlayBot.start();
  console.log('[server] auto-play mode enabled');
}

server.listen(Number(env.PORT), () => {
  console.log(`[server] listening on http://localhost:${env.PORT}`);
});

server.on('close', stopHeartbeat);
server.on('close', () => autoPlayBot?.stop());

process.once('SIGTERM', () => {
  stopHeartbeat();
  autoPlayBot?.stop();
});
process.once('SIGINT', () => {
  stopHeartbeat();
  autoPlayBot?.stop();
  process.exit(0);
});
