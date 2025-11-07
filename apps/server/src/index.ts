
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
import { createTable, joinTable, bet as coreBet, deal } from '@game-core/engine';
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
const lobby = createLobbyRegistry();

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

// One in-memory table for the prototype
const TABLE_ID = 'default';
const TABLE_CAPACITY = 6;
const state = createTable(TABLE_ID, 'seed-proto');

function updateLobbyFromState() {
  lobby.upsertRoom({
    id: TABLE_ID,
    capacity: TABLE_CAPACITY,
    players: state.seats.length,
    status: deriveLobbyRoomStatus(state.seats.length, TABLE_CAPACITY)
  });
}

updateLobbyFromState();

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

  // send snapshot
  emitState();

  socket.on('joinTable', (payload) => {
    const parsed = JoinTable.safeParse(payload);
    if (!parsed.success) return;
    if (parsed.data.tableId !== TABLE_ID) {
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

    const alreadySeated = state.seats.some(id => state.players[id]?.userId === user.id);
    if (alreadySeated) {
      socket.emit('errorMessage', { message: 'User already seated at the table' });
      return;
    }

    joinTable(state, socket.id, user.nickname, user.id);
    deal(state, 2); // auto-deal for demo
    updateLobbyFromState();
    emitState();
  });

  socket.on('bet', (payload) => {
    const parsed = Bet.safeParse(payload);
    if (!parsed.success) return;
    if (parsed.data.tableId !== TABLE_ID) {
      socket.emit('errorMessage', { message: 'Unknown table' });
      return;
    }
    try {
      coreBet(state, socket.id, parsed.data.chips);
      emitState();
    } catch (e) {
      socket.emit('errorMessage', { message: (e as Error).message });
    }
  });

  socket.on('disconnect', () => {
    // For simplicity, keep player entry; production would handle seats cleanup/timeouts.
    heartbeat.publish();
  });
});

function emitState() {
  const snapshot: ServerState = {
    tableId: TABLE_ID,
    seats: state.seats.map(id => {
      const p = state.players[id];
      return { id: p.id, userId: p.userId, nickname: p.nickname, chips: p.chips };
    }),
    pot: state.pot
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
