
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Bet, JoinTable, ServerState } from '@shared/messages';
import { createTable, joinTable, bet as coreBet, deal } from '@game-core/engine';
import { loadServerEnv } from '@shared/env';

const env = loadServerEnv();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ['http://localhost:3000'], credentials: true }
});

// One in-memory table for the prototype
const TABLE_ID = 'default';
const state = createTable(TABLE_ID, 'seed-proto');

app.get('/health', (_req, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  // send snapshot
  emitState();

  socket.on('joinTable', (payload) => {
    const parsed = JoinTable.safeParse(payload);
    if (!parsed.success) return;
    joinTable(state, socket.id, parsed.data.nickname);
    deal(state, 2); // auto-deal for demo
    emitState();
  });

  socket.on('bet', (payload) => {
    const parsed = Bet.safeParse(payload);
    if (!parsed.success) return;
    try {
      coreBet(state, socket.id, parsed.data.chips);
      emitState();
    } catch (e) {
      socket.emit('errorMessage', { message: (e as Error).message });
    }
  });

  socket.on('disconnect', () => {
    // For simplicity, keep player entry; production would handle seats cleanup/timeouts.
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
