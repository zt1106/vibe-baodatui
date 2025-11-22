import { afterEach, describe, expect, it, vi } from 'vitest';
import http from 'http';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import { TableManager } from '../domain/tableManager';
import { createLobbyRegistry } from '../infrastructure/lobbyRegistry';
import { createUserRegistry } from '../infrastructure/userRegistry';
import { createHeartbeatPublisher } from '../infrastructure/heartbeat';
import { registerTableSocketHandlers } from '../socket/tableHandlers';

function waitFor<T>(emitter: any, event: string, predicate?: (payload: T) => boolean): Promise<T> {
  return new Promise(resolve => {
    const handler = (payload: T) => {
      if (predicate && !predicate(payload)) return;
      emitter.off(event, handler);
      resolve(payload);
    };
    emitter.on(event, handler);
  });
}

async function startSocketServer() {
  const httpServer = http.createServer();
  const io = new Server(httpServer, { cors: { origin: '*' } });
  const lobby = createLobbyRegistry();
  const users = createUserRegistry();
  const tableManager = new TableManager({ io, lobby, users });
  const heartbeat = createHeartbeatPublisher(io);
  registerTableSocketHandlers(io, tableManager, heartbeat);
  await new Promise<void>(resolve => httpServer.listen(0, resolve));
  const addr = httpServer.address();
  const port = typeof addr === 'string' ? 0 : addr?.port ?? 0;
  return { httpServer, io, lobby, users, tableManager, port };
}

describe('table socket handlers', () => {
  const sockets: Client.Socket[] = [];

  afterEach(async () => {
    await Promise.all(
      sockets.splice(0).map(
        socket =>
          new Promise<void>(resolve => {
            socket.disconnect();
            socket.close();
            resolve();
          })
      )
    );
  });

  it('handles join, preparation, start, and leave flows over sockets', async () => {
    const dealingStub = vi
      .spyOn<any, any>(TableManager.prototype as any, 'startDouDizhuDealing')
      .mockImplementation((table: any) => {
        table.dealingState = null;
        table.gamePhase = 'dealing';
      });

    const server = await startSocketServer();
    const { io, httpServer, users, tableManager, port, lobby } = server;

    const host = users.register('Host');
    const playerTwo = users.register('Player Two');
    const playerThree = users.register('Player Three');
    const table = tableManager.createTable(host, 'dou-dizhu');

    const hostClient = Client(`http://127.0.0.1:${port}`);
    sockets.push(hostClient);
    await waitFor(hostClient, 'connect');
    const hostJoined = waitFor(hostClient, 'state', state => state.seats.length === 1);
    hostClient.emit('joinTable', { tableId: table.tableId, nickname: host.nickname, userId: host.id });
    await hostJoined;

    const p2Client = Client(`http://127.0.0.1:${port}`);
    sockets.push(p2Client);
    await waitFor(p2Client, 'connect');
    const p2Joined = waitFor(hostClient, 'state', state => state.seats.length === 2);
    p2Client.emit('joinTable', {
      tableId: table.tableId,
      nickname: playerTwo.nickname,
      userId: playerTwo.id
    });
    await p2Joined;

    const p3Client = Client(`http://127.0.0.1:${port}`);
    sockets.push(p3Client);
    await waitFor(p3Client, 'connect');
    const p3Joined = waitFor(hostClient, 'state', state => state.seats.length === 3);
    p3Client.emit('joinTable', {
      tableId: table.tableId,
      nickname: playerThree.nickname,
      userId: playerThree.id
    });
    await p3Joined;

    const preparedState = waitFor(hostClient, 'state', state => state.seats.every((seat: any) => seat.prepared));
    hostClient.emit('table:setPrepared', { tableId: table.tableId, prepared: true });
    p2Client.emit('table:setPrepared', { tableId: table.tableId, prepared: true });
    p3Client.emit('table:setPrepared', { tableId: table.tableId, prepared: true });
    await preparedState;

    const startedPromise = waitFor(hostClient, 'state', state => state.status === 'in-progress');
    hostClient.emit('table:start', { tableId: table.tableId });
    const started = await startedPromise;
    expect(started.seats).toHaveLength(3);

    const waitingState = waitFor(hostClient, 'state', state => state.seats.length === 2 && state.status === 'waiting');
    const leaveAck = await new Promise<{ ok: boolean }>(resolve => {
      p2Client.emit('game:leave', { tableId: table.tableId, userId: playerTwo.id }, resolve);
    });
    await waitingState;
    expect(leaveAck).toEqual({ ok: true });
    expect(lobby.snapshot().rooms[0].players).toBe(2);

    dealingStub.mockRestore();
    await new Promise<void>(resolve => {
      io.close(() => {
        httpServer.close(() => resolve());
      });
    });
  });
});
