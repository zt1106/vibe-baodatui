
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Bet, JoinTable, ServerState } from '@shared/messages';
import { createTable, joinTable, bet as coreBet, deal } from '@game-core/engine';
import { loadServerEnv } from '@shared/env';
import { createHeartbeatPublisher } from './infrastructure/heartbeat';

const env = loadServerEnv();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ['http://localhost:3000'], credentials: true }
});
const heartbeat = createHeartbeatPublisher(io);
const stopHeartbeat = heartbeat.start();

// One in-memory table for the prototype
const TABLE_ID = 'default';
const state = createTable(TABLE_ID, 'seed-proto');

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/ready', (_req, res) => {
  const snapshot = heartbeat.snapshot();
  res.json({ ok: snapshot.status === 'ok', uptimeMs: snapshot.uptimeMs, connections: snapshot.connections });
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
    joinTable(state, socket.id, parsed.data.nickname);
    deal(state, 2); // auto-deal for demo
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
      return { id: p.id, nickname: p.nickname, chips: p.chips };
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
