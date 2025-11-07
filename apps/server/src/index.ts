
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import {
  Bet,
  JoinTable,
  ServerState,
  RegisterUserRequest,
  RegisterUserResponse,
  LoginUserRequest,
  LoginUserResponse
} from '@shared/messages';
import type { LobbyRoom } from '@shared/messages';
import { createTable, joinTable, bet as coreBet, deal } from '@game-core/engine';
import type { TableState } from '@game-core/engine';
import { loadServerEnv } from '@shared/env';
import { createHeartbeatPublisher } from './infrastructure/heartbeat';
import { createLobbyRegistry, deriveLobbyRoomStatus } from './infrastructure/lobbyRegistry';
import {
  DuplicateNicknameError,
  UserNotFoundError,
  createUserRegistry
} from './infrastructure/userRegistry';

const env = loadServerEnv();
const app = express();

app.use(express.json());

const allowedOrigins = new Set(['http://localhost:3000']);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ['http://localhost:3000'], credentials: true }
});
const heartbeat = createHeartbeatPublisher(io);
const stopHeartbeat = heartbeat.start();
const users = createUserRegistry();

type TableConfiguration = {
  id: string;
  capacity: number;
  seed: string;
};

const tableConfigurations: TableConfiguration[] = [
  { id: 'default', capacity: 6, seed: 'seed-proto' }
];

const tableConfigById = new Map<string, TableConfiguration>();
for (const config of tableConfigurations) {
  tableConfigById.set(config.id, config);
}

const lobby = createLobbyRegistry({
  rooms: tableConfigurations.map((config) => ({
    id: config.id,
    capacity: config.capacity,
    players: 0,
    status: deriveLobbyRoomStatus(0, config.capacity)
  }))
});

const tables = new Map<string, TableState>();

const normalizeNickname = (value: string) => value.trim().toLowerCase();

app.post('/auth/register', (req, res) => {
  const parsed = RegisterUserRequest.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request payload' });
    return;
  }
  try {
    const user = users.register(parsed.data.nickname);
    res.status(201).json(RegisterUserResponse.parse({ user }));
  } catch (error) {
    if (error instanceof DuplicateNicknameError) {
      res.status(409).json({ error: 'Nickname already registered' });
      return;
    }
    console.error('[server] failed to register user', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/auth/login', (req, res) => {
  const parsed = LoginUserRequest.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request payload' });
    return;
  }
  try {
    const user = users.login(parsed.data.nickname);
    res.json(LoginUserResponse.parse({ user }));
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      res.status(404).json({ error: 'Nickname not found' });
      return;
    }
    console.error('[server] failed to login user', error);
    res.status(500).json({ error: 'Failed to login user' });
  }
});

function getTableConfig(tableId: string) {
  return tableConfigById.get(tableId);
}

function getTableState(tableId: string) {
  return tables.get(tableId);
}

function getOrCreateTableState(tableId: string) {
  const config = getTableConfig(tableId);
  if (!config) return undefined;
  let table = getTableState(tableId);
  if (!table) {
    table = createTable(tableId, config.seed);
    tables.set(tableId, table);
  }
  return table;
}

function buildRoomSnapshot(tableId: string, table?: TableState): LobbyRoom | undefined {
  const config = getTableConfig(tableId);
  if (!config) return undefined;
  const players = table?.seats.length ?? 0;
  return {
    id: tableId,
    capacity: config.capacity,
    players,
    status: deriveLobbyRoomStatus(players, config.capacity)
  };
}

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/ready', (_req, res) => {
  const snapshot = heartbeat.snapshot();
  res.json({ ok: snapshot.status === 'ok', uptimeMs: snapshot.uptimeMs, connections: snapshot.connections });
});

app.get('/lobby/rooms', (_req, res) => {
  try {
    res.json(lobby.snapshot());
  } catch (error) {
    console.error('[server] failed to build lobby snapshot', error);
    res.status(500).json({ error: 'Failed to load lobby rooms' });
  }
});

io.on('connection', (socket) => {
  heartbeat.handleConnection(socket);
  heartbeat.publish();

  socket.on('joinTable', (payload) => {
    const parsed = JoinTable.safeParse(payload);
    if (!parsed.success) return;
    const tableId = parsed.data.tableId;
    const config = getTableConfig(tableId);
    if (!config) {
      socket.emit('errorMessage', { message: 'Unknown table' });
      return;
    }

    const nickname = parsed.data.nickname;
    const requestedUserId = parsed.data.userId;

    let user;
    try {
      if (typeof requestedUserId === 'number') {
        const existing = users.findById(requestedUserId);
        if (!existing || normalizeNickname(existing.nickname) !== normalizeNickname(nickname)) {
          socket.emit('errorMessage', { message: 'Invalid user credentials for table join' });
          return;
        }
        user = existing;
      } else {
        try {
          user = users.register(nickname);
        } catch (error) {
          if (error instanceof DuplicateNicknameError) {
            user = users.login(nickname);
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      if (error instanceof DuplicateNicknameError) {
        socket.emit('errorMessage', { message: 'Nickname already registered' });
      } else if (error instanceof UserNotFoundError) {
        socket.emit('errorMessage', { message: 'Nickname not registered' });
      } else {
        console.error('[server] failed to process joinTable', error);
        socket.emit('errorMessage', { message: 'Failed to join table' });
      }
      return;
    }

    const table = getOrCreateTableState(tableId);
    if (!table) {
      socket.emit('errorMessage', { message: 'Unknown table' });
      return;
    }

    if (table.seats.length >= config.capacity) {
      socket.emit('errorMessage', { message: 'Table is full' });
      return;
    }

    const alreadySeated = table.seats.some(id => table.players[id]?.userId === user.id);
    if (alreadySeated) {
      socket.emit('errorMessage', { message: 'User already seated at the table' });
      return;
    }

    joinTable(table, socket.id, user.nickname, user.id);
    deal(table, 2); // auto-deal for demo
    socket.join(tableId);
    emitState(tableId);
  });

  socket.on('bet', (payload) => {
    const parsed = Bet.safeParse(payload);
    if (!parsed.success) return;
    const tableId = parsed.data.tableId;
    const table = getTableState(tableId);
    if (!table) {
      socket.emit('errorMessage', { message: 'Unknown table' });
      return;
    }
    try {
      coreBet(table, socket.id, parsed.data.chips);
      emitState(tableId);
    } catch (e) {
      socket.emit('errorMessage', { message: (e as Error).message });
    }
  });

  socket.on('disconnect', () => {
    // For simplicity, keep player entry; production would handle seats cleanup/timeouts.
    heartbeat.publish();
  });
});

function emitState(tableId: string) {
  const table = getTableState(tableId);
  if (!table) return;
  const room = buildRoomSnapshot(tableId, table);
  if (!room) return;
  lobby.upsertRoom(room);
  const snapshot: ServerState = {
    tableId: table.id,
    room,
    seats: table.seats.map(id => {
      const p = table.players[id];
      return { id: p.id, userId: p.userId, nickname: p.nickname, chips: p.chips };
    }),
    pot: table.pot
  };
  io.to(tableId).emit('state', snapshot);
}

server.listen(Number(env.PORT), () => {
  console.log(`[server] listening on http://localhost:${env.PORT}`);
});

server.on('close', stopHeartbeat);

process.once('SIGTERM', stopHeartbeat);
process.once('SIGINT', () => {
  stopHeartbeat();
  process.exit(0);
});
