import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import http from 'http';
import type { Server, Socket } from 'socket.io';
import { buildAllowedOrigins, createHttpApp } from '../http/app';
import { registerLobbyRoutes } from '../http/routes/lobby';
import { registerTableRoutes } from '../http/routes/tables';
import { createLobbyRegistry } from '../infrastructure/lobbyRegistry';
import { createUserRegistry } from '../infrastructure/userRegistry';
import { TableManager } from '../domain/tableManager';
import { getVariantSummary, DEFAULT_VARIANT_ID } from '@shared/variants';

class FakeSocket {
  constructor(public id: string) {}
  join() {}
  emit() {}
}

class StubIo {
  sockets = { sockets: new Map<string, FakeSocket>() };
  to() {
    return { emit() {} };
  }
  emit() {}
}

describe('HTTP routes', () => {
  let server: http.Server;
  let baseUrl: string;
  let lobby: ReturnType<typeof createLobbyRegistry>;
  let users: ReturnType<typeof createUserRegistry>;
  let tableManager: TableManager;

  beforeEach(async () => {
    lobby = createLobbyRegistry();
    users = createUserRegistry();
    tableManager = new TableManager({
      io: new StubIo() as unknown as Server,
      lobby,
      users
    });
    const app = createHttpApp(buildAllowedOrigins(undefined));
    registerLobbyRoutes(app, lobby);
    registerTableRoutes(app, { tableManager, users });
    server = app.listen(0);
    await new Promise<void>(resolve => server.on('listening', resolve));
    const addr = server.address();
    const port = typeof addr === 'string' ? 0 : addr?.port ?? 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  it('serves lobby snapshots', async () => {
    lobby.upsertRoom({
      id: 'table-42',
      status: 'waiting',
      players: 1,
      capacity: 3,
      variant: getVariantSummary(DEFAULT_VARIANT_ID)
    });
    const res = await fetch(`${baseUrl}/lobby/rooms`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rooms[0]).toMatchObject({ id: 'table-42', players: 1 });
  });

  it('validates table creation payloads', async () => {
    const invalid = await fetch(`${baseUrl}/tables`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    expect(invalid.status).toBe(400);

    const host = users.register('Table Host');
    const unknownHost = await fetch(`${baseUrl}/tables`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        host: { userId: host.id + 10, nickname: host.nickname, avatar: host.avatar },
        variantId: DEFAULT_VARIANT_ID
      })
    });
    expect(unknownHost.status).toBe(400);

    const ok = await fetch(`${baseUrl}/tables`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        host: { userId: host.id, nickname: host.nickname, avatar: host.avatar },
        variantId: DEFAULT_VARIANT_ID
      })
    });
    expect(ok.status).toBe(201);
    const created = await ok.json();
    expect(created.tableId).toBeTruthy();
    expect(lobby.snapshot().rooms[0].id).toBe(created.tableId);
  });

  it('returns prepare and play payloads when players are seated', async () => {
    const missing = await fetch(`${baseUrl}/tables/unknown/prepare`);
    expect(missing.status).toBe(404);

    const host = users.register('Seat Host');
    const table = tableManager.createTable(host, DEFAULT_VARIANT_ID);
    const prepare = await fetch(`${baseUrl}/tables/${table.tableId}/prepare`);
    expect(prepare.status).toBe(200);
    const prepareBody = await prepare.json();
    expect(prepareBody.tableId).toBe(table.tableId);

    const invalidUser = await fetch(`${baseUrl}/tables/${table.tableId}/play`);
    expect(invalidUser.status).toBe(400);

    const notSeated = await fetch(`${baseUrl}/tables/${table.tableId}/play?userId=${host.id}`);
    expect(notSeated.status).toBe(404);

    const hostSocket = new FakeSocket('socket-host');
    tableManager.handleJoin(hostSocket as unknown as Socket, {
      tableId: table.tableId,
      nickname: host.nickname,
      userId: host.id
    });

    const play = await fetch(`${baseUrl}/tables/${table.tableId}/play?userId=${host.id}`);
    expect(play.status).toBe(200);
    const playBody = await play.json();
    expect(playBody.snapshot.tableId).toBe(table.tableId);
  });
});
