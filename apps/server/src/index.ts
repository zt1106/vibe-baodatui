
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { randomUUID } from 'crypto';
import { Server } from 'socket.io';
import {
  JoinTable,
  ServerState,
  RegisterUserRequest,
  RegisterUserResponse,
  LoginUserRequest,
  LoginUserResponse,
  TablePrepareResponse
} from '@shared/messages';
import { createTable, joinTable, deal } from '@game-core/engine';
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

const allowedOrigins = new Set(
  (env.WEB_ORIGINS ?? '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
);
if (allowedOrigins.size === 0) {
  allowedOrigins.add('http://localhost:3000');
}
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
const allowedOriginsList = Array.from(allowedOrigins);
const io = new Server(server, {
  cors: { origin: allowedOriginsList, credentials: true }
});
const heartbeat = createHeartbeatPublisher(io);
const stopHeartbeat = heartbeat.start();
const users = createUserRegistry();
const lobby = createLobbyRegistry();

type ManagedTable = {
  id: string;
  state: ReturnType<typeof createTable>;
  config: {
    capacity: number;
    minimumPlayers: number;
  };
};

const TABLE_CAPACITY = 6;
const TABLE_MIN_PLAYERS = 2;
const tables = new Map<string, ManagedTable>();
const socketTable = new Map<string, string>();

const generateTableId = () => {
  let id = '';
  do {
    id = `room-${randomUUID().slice(0, 8)}`;
  } while (tables.has(id));
  return id;
};

function normalizeTableId(id: string) {
  return id.trim();
}

function updateLobbyFromState(tableId: string) {
  const managed = tables.get(tableId);
  if (!managed) return;
  const {
    state,
    config: { capacity }
  } = managed;
  lobby.upsertRoom({
    id: tableId,
    capacity,
    players: state.seats.length,
    status: deriveLobbyRoomStatus(state.seats.length, capacity)
  });
}

function buildPreparePayload(table: ManagedTable) {
  return TablePrepareResponse.parse({
    tableId: table.id,
    status: deriveLobbyRoomStatus(table.state.seats.length, table.config.capacity),
    players: table.state.seats
      .map(playerId => table.state.players[playerId])
      .filter((player): player is NonNullable<typeof player> => Boolean(player))
      .map(player => ({
        userId: player.userId,
        nickname: player.nickname
      })),
    config: {
      capacity: table.config.capacity,
      minimumPlayers: table.config.minimumPlayers
    }
  });
}

function createManagedTable(id = generateTableId()): ManagedTable {
  const normalizedId = normalizeTableId(id);
  if (!normalizedId) {
    throw new Error('Invalid table id');
  }
  if (tables.has(normalizedId)) {
    throw new Error(`Table ${normalizedId} already exists`);
  }
  const managed: ManagedTable = {
    id: normalizedId,
    state: createTable(normalizedId, `seed-${normalizedId}`),
    config: {
      capacity: TABLE_CAPACITY,
      minimumPlayers: Math.min(TABLE_MIN_PLAYERS, TABLE_CAPACITY)
    }
  };
  tables.set(normalizedId, managed);
  updateLobbyFromState(normalizedId);
  return managed;
}

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

app.get('/tables/:tableId/prepare', (req, res) => {
  const requestedId = normalizeTableId(req.params.tableId ?? '');
  const table = tables.get(requestedId);
  if (!table) {
    res.status(404).json({ error: 'Unknown table' });
    return;
  }
  try {
    res.json(buildPreparePayload(table));
  } catch (error) {
    console.error('[server] failed to build prepare snapshot', error);
    res.status(500).json({ error: 'Failed to load table' });
  }
});

app.post('/tables', (_req, res) => {
  try {
    const table = createManagedTable();
    res.status(201).json(buildPreparePayload(table));
  } catch (error) {
    console.error('[server] failed to create table', error);
    res.status(500).json({ error: 'Failed to create table' });
  }
});

io.on('connection', (socket) => {
  heartbeat.handleConnection(socket);
  heartbeat.publish();

  tables.forEach((_table, tableId) => emitState(tableId));

  socket.on('joinTable', (payload) => {
    const parsed = JoinTable.safeParse(payload);
    if (!parsed.success) return;
    const tableId = normalizeTableId(parsed.data.tableId ?? '');
    const table = tables.get(tableId);
    if (!table) {
      socket.emit('errorMessage', { message: 'Unknown table' });
      return;
    }

    if (table.state.seats.length >= table.config.capacity) {
      socket.emit('errorMessage', { message: 'Table is full' });
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

    const alreadySeated = table.state.seats.some(id => table.state.players[id]?.userId === user.id);
    if (alreadySeated) {
      socket.emit('errorMessage', { message: 'User already seated at the table' });
      return;
    }

    joinTable(table.state, socket.id, user.nickname, user.id);
    deal(table.state, 2); // auto-deal for demo
    socketTable.set(socket.id, tableId);
    updateLobbyFromState(tableId);
    emitState(tableId);
  });

  socket.on('disconnect', () => {
    socketTable.delete(socket.id);
    // For simplicity, keep player entry; production would handle seats cleanup/timeouts.
    heartbeat.publish();
  });
});

function emitState(tableId: string) {
  const table = tables.get(tableId);
  if (!table) return;
  const snapshot: ServerState = {
    tableId: table.id,
    seats: table.state.seats
      .map(id => table.state.players[id])
      .filter((player): player is NonNullable<typeof player> => Boolean(player))
      .map(player => ({
        id: player.id,
        userId: player.userId,
        nickname: player.nickname
      }))
  };
  io.emit('state', snapshot);
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
