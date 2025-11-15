
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { randomUUID } from 'crypto';
import { Server, type Socket } from 'socket.io';
import {
  JoinTable,
  ServerState,
  RegisterUserRequest,
  RegisterUserResponse,
  LoginUserRequest,
  LoginUserResponse,
  TablePrepareResponse,
  CreateTableRequest,
  TableStartRequest,
  TableKickRequest,
  TableConfigUpdateRequest,
  TablePreparedRequest
} from '@shared/messages';
import { createTable, joinTable, deal } from '@game-core/engine';
import { loadServerEnv } from '@shared/env';
import { DEFAULT_AVATAR } from '../../../packages/shared/src/avatars';
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
const USER_AVATAR_FALLBACK = DEFAULT_AVATAR ?? '1F332.png';

function resolveUserAvatar(userId: number) {
  const record = users.findById(userId);
  return record?.avatar ?? USER_AVATAR_FALLBACK;
}

type ManagedTable = {
  id: string;
  state: ReturnType<typeof createTable>;
  config: {
    capacity: number;
  };
  host: {
    userId: number;
    nickname: string;
  };
  hasStarted: boolean;
  prepared: Map<number, boolean>;
};

const TABLE_CAPACITY = 6;
const tables = new Map<string, ManagedTable>();
const socketTable = new Map<string, string>();
const socketUsers = new Map<string, number>();

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

function ensureHostAction(socket: Socket, tableId: string) {
  const managed = tables.get(tableId);
  if (!managed) {
    socket.emit('errorMessage', { message: 'Unknown table' });
    return null;
  }
  const userId = socketUsers.get(socket.id);
  if (userId !== managed.host.userId) {
    socket.emit('errorMessage', { message: 'Only the host can perform this action' });
    return null;
  }
  return managed;
}

function resetTablePhaseIfNeeded(table: ManagedTable) {
  if (table.state.seats.length < table.config.capacity) {
    table.hasStarted = false;
    setAllPrepared(table, false);
  }
}

function setAllPrepared(table: ManagedTable, prepared: boolean) {
  for (const seatId of table.state.seats) {
    const player = table.state.players[seatId];
    if (player) {
      table.prepared.set(player.userId, prepared);
    }
  }
}

function getTableStatus(managed: ManagedTable) {
  const {
    state,
    config: { capacity },
    hasStarted
  } = managed;
  if (hasStarted) {
    return 'in-progress';
  }
  return deriveLobbyRoomStatus(state.seats.length, capacity);
}

function updateLobbyFromState(tableId: string) {
  const managed = tables.get(tableId);
  if (!managed) return;
  const {
    state,
    config: { capacity }
  } = managed;
  const status = getTableStatus(managed);
  lobby.upsertRoom({
    id: tableId,
    capacity,
    players: state.seats.length,
    status
  });
}

function buildPreparePayload(table: ManagedTable) {
  const status = getTableStatus(table);
  return TablePrepareResponse.parse({
    tableId: table.id,
    status,
    host: {
      userId: table.host.userId,
      nickname: table.host.nickname,
      avatar: resolveUserAvatar(table.host.userId)
    },
    players: table.state.seats
      .map(playerId => table.state.players[playerId])
      .filter((player): player is NonNullable<typeof player> => Boolean(player))
      .map(player => ({
        userId: player.userId,
        nickname: player.nickname,
        avatar: resolveUserAvatar(player.userId),
        prepared: table.prepared.get(player.userId) ?? false
      })),
    config: {
      capacity: table.config.capacity
    }
  });
}

function createManagedTable(host: { id: number; nickname: string }, id = generateTableId()): ManagedTable {
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
      capacity: TABLE_CAPACITY
    },
    host: {
      userId: host.id,
      nickname: host.nickname
    },
    hasStarted: false,
    prepared: new Map()
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

app.post('/tables', (req, res) => {
  const parsed = CreateTableRequest.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid create table payload' });
    return;
  }
  const hostRecord = users.findById(parsed.data.host.userId);
  if (!hostRecord || normalizeNickname(hostRecord.nickname) !== normalizeNickname(parsed.data.host.nickname)) {
    res.status(400).json({ error: 'Unknown host user' });
    return;
  }
  try {
    const table = createManagedTable(hostRecord);
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
    socketUsers.set(socket.id, user.id);
    table.prepared.set(user.id, false);
    updateLobbyFromState(tableId);
    emitState(tableId);
  });

  socket.on('table:start', (payload) => {
    const parsed = TableStartRequest.safeParse(payload);
    if (!parsed.success) return;
    const tableId = normalizeTableId(parsed.data.tableId ?? '');
    const managed = ensureHostAction(socket, tableId);
    if (!managed) return;
    if (managed.state.seats.length !== managed.config.capacity) {
      socket.emit('errorMessage', { message: '房间未满，无法开始' });
      return;
    }
    managed.hasStarted = true;
    deal(managed.state, 2);
    setAllPrepared(managed, false);
    updateLobbyFromState(tableId);
    emitState(tableId);
  });

  socket.on('table:kick', (payload) => {
    const parsed = TableKickRequest.safeParse(payload);
    if (!parsed.success) return;
    const tableId = normalizeTableId(parsed.data.tableId ?? '');
    const managed = ensureHostAction(socket, tableId);
    if (!managed) return;
    if (parsed.data.userId === managed.host.userId) {
      socket.emit('errorMessage', { message: 'Host cannot be removed' });
      return;
    }
    const targetSeatId = managed.state.seats.find(id => managed.state.players[id]?.userId === parsed.data.userId);
    if (!targetSeatId) {
      socket.emit('errorMessage', { message: 'Player not found at the table' });
      return;
    }
    managed.state.seats = managed.state.seats.filter(id => id !== targetSeatId);
    delete managed.state.players[targetSeatId];
    socketTable.delete(targetSeatId);
    socketUsers.delete(targetSeatId);
    managed.prepared.delete(parsed.data.userId);
    const targetSocket = io.sockets.sockets.get(targetSeatId);
    targetSocket?.emit('kicked', { tableId });
    targetSocket?.disconnect(true);
    resetTablePhaseIfNeeded(managed);
    updateLobbyFromState(tableId);
    emitState(tableId);
  });

  socket.on('table:updateConfig', (payload) => {
    const parsed = TableConfigUpdateRequest.safeParse(payload);
    if (!parsed.success) return;
    const tableId = normalizeTableId(parsed.data.tableId ?? '');
    const managed = ensureHostAction(socket, tableId);
    if (!managed) return;
    const requestedCapacity = Math.min(Math.max(parsed.data.capacity, 2), TABLE_CAPACITY);
    const currentPlayers = managed.state.seats.length;
    if (requestedCapacity < currentPlayers) {
      socket.emit('errorMessage', { message: '人数已超过该上限' });
      return;
    }
    managed.config.capacity = requestedCapacity;
    resetTablePhaseIfNeeded(managed);
    updateLobbyFromState(tableId);
    emitState(tableId);
  });

  socket.on('table:setPrepared', (payload) => {
    const parsed = TablePreparedRequest.safeParse(payload);
    if (!parsed.success) return;
    const tableId = normalizeTableId(parsed.data.tableId ?? '');
    const managed = tables.get(tableId);
    if (!managed) {
      socket.emit('errorMessage', { message: 'Unknown table' });
      return;
    }
    const userId = socketUsers.get(socket.id);
    if (!userId) {
      socket.emit('errorMessage', { message: 'Unknown user' });
      return;
    }
    const seated = managed.state.seats.some(id => managed.state.players[id]?.userId === userId);
    if (!seated) {
      socket.emit('errorMessage', { message: 'Player not seated at this table' });
      return;
    }
    managed.prepared.set(userId, parsed.data.prepared);
    emitState(tableId);
  });

  socket.on('disconnect', () => {
    socketTable.delete(socket.id);
    socketUsers.delete(socket.id);
    // For simplicity, keep player entry; production would handle seats cleanup/timeouts.
    heartbeat.publish();
  });
});

function emitState(tableId: string) {
  const table = tables.get(tableId);
  if (!table) return;
  const status = getTableStatus(table);
  const snapshot: ServerState = {
    tableId: table.id,
    status,
    host: {
      userId: table.host.userId,
      nickname: table.host.nickname,
      avatar: resolveUserAvatar(table.host.userId)
    },
    config: table.config,
    seats: table.state.seats
      .map(id => table.state.players[id])
      .filter((player): player is NonNullable<typeof player> => Boolean(player))
      .map(player => ({
        id: player.id,
        userId: player.userId,
        nickname: player.nickname,
        avatar: resolveUserAvatar(player.userId),
        prepared: table.prepared.get(player.userId) ?? false
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
