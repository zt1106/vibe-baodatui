import { describe, expect, it, vi } from 'vitest';
import type { AppServer, AppServerSocket } from '@shared/events';
import { derivePhaseStatus } from '@shared/tablePhases';
import { TableDealingCoordinator, type TableDealingDeps } from '../domain/tableDealing';
import { TableManager } from '../domain/tableManager';
import { createLobbyRegistry } from '../infrastructure/lobbyRegistry';
import { createUserRegistry } from '../infrastructure/userRegistry';

class FakeSocket {
  id: string;
  emitted: Record<string, unknown[]> = {};
  rooms = new Set<string>();

  constructor(id: string, public nickname: string) {
    this.id = id;
  }

  join(room: string) {
    this.rooms.add(room);
  }

  leave(room: string) {
    this.rooms.delete(room);
  }

  emit(event: string, payload: unknown) {
    (this.emitted[event] ||= []).push(payload);
  }
}

class FakeIo {
  roomEmits: Record<string, Array<{ event: string; payload: unknown }>> = {};
  broadcasts: Array<{ event: string; payload: unknown }> = [];
  sockets = { sockets: new Map<string, FakeSocket>() };

  to(room: string) {
    return {
      emit: (event: string, payload: unknown) => {
        (this.roomEmits[room] ||= []).push({ event, payload });
      }
    };
  }

  emit(event: string, payload: unknown) {
    this.broadcasts.push({ event, payload });
  }
}

class StubTableDealingCoordinator extends TableDealingCoordinator {
  override start = vi.fn<TableDealingCoordinator['start']>((table, _config) => {
    table.dealingState = null;
    table.phase = { status: 'dealing' };
  });

  override stop = vi.fn<TableDealingCoordinator['stop']>((table) => {
    table.dealingState = null;
  });
}

const setupTableManager = (options?: { createDealingCoordinator?: (deps: TableDealingDeps) => TableDealingCoordinator }) => {
  const io = new FakeIo();
  const lobby = createLobbyRegistry();
  const users = createUserRegistry();
  const manager = new TableManager({
    io: io as unknown as AppServer,
    lobby,
    users,
    createDealingCoordinator: options?.createDealingCoordinator
  });
  return { io, lobby, users, manager };
};

const getErrorMessage = (socket: FakeSocket, index = -1) => {
  const errors = socket.emitted.errorMessage as Array<{ message?: string }> | undefined;
  if (!errors) return undefined;
  return index === -1 ? errors.at(-1)?.message : errors[index]?.message;
};

describe('TableManager lifecycle', () => {
  it('tracks lobby snapshots as players join and leave', () => {
    const { lobby, users, manager } = setupTableManager();
    const host = users.register('Host');
    const playerTwo = users.register('Player Two');
    const playerThree = users.register('Player Three');
    const table = manager.createTable(host, 'dou-dizhu');

    const hostSocket = new FakeSocket('socket-host', host.nickname);
    const p2Socket = new FakeSocket('socket-2', playerTwo.nickname);
    const p3Socket = new FakeSocket('socket-3', playerThree.nickname);

    manager.handleJoin(hostSocket as unknown as AppServerSocket, {
      tableId: table.tableId,
      nickname: host.nickname,
      userId: host.id
    });
    expect(lobby.snapshot().rooms[0]).toMatchObject({ id: table.tableId, players: 1, status: 'waiting' });

    manager.handleJoin(p2Socket as unknown as AppServerSocket, {
      tableId: table.tableId,
      nickname: playerTwo.nickname,
      userId: playerTwo.id
    });
    manager.handleJoin(p3Socket as unknown as AppServerSocket, {
      tableId: table.tableId,
      nickname: playerThree.nickname,
      userId: playerThree.id
    });

    const filled = lobby.snapshot();
    expect(filled.rooms[0]).toMatchObject({ players: 3, status: 'full' });

    const leaveAck = vi.fn();
    manager.handleLeave(p2Socket as unknown as AppServerSocket, { tableId: table.tableId, userId: playerTwo.id }, leaveAck);
    expect(leaveAck).toHaveBeenCalledWith({ ok: true });
    expect(lobby.snapshot().rooms[0].players).toBe(2);

    manager.handleLeave(hostSocket as unknown as AppServerSocket, { tableId: table.tableId, userId: host.id });
    manager.handleLeave(p3Socket as unknown as AppServerSocket, { tableId: table.tableId, userId: playerThree.id });

    expect(lobby.snapshot().rooms).toHaveLength(0);
    expect(manager.getPrepareState(table.tableId)).toBeNull();
  });

  it('requires the host and prepared players before starting a game', () => {
    let dealingCoordinator: StubTableDealingCoordinator | null = null;
    const { lobby, users, manager } = setupTableManager({
      createDealingCoordinator: (deps: TableDealingDeps) => {
        dealingCoordinator = new StubTableDealingCoordinator(deps);
        return dealingCoordinator;
      }
    });
    const host = users.register('Host');
    const playerTwo = users.register('Player Two');
    const playerThree = users.register('Player Three');
    const table = manager.createTable(host, 'dou-dizhu');

    const hostSocket = new FakeSocket('socket-host', host.nickname);
    const p2Socket = new FakeSocket('socket-2', playerTwo.nickname);
    const p3Socket = new FakeSocket('socket-3', playerThree.nickname);

    manager.handleJoin(hostSocket as unknown as AppServerSocket, {
      tableId: table.tableId,
      nickname: host.nickname,
      userId: host.id
    });
    manager.handleJoin(p2Socket as unknown as AppServerSocket, {
      tableId: table.tableId,
      nickname: playerTwo.nickname,
      userId: playerTwo.id
    });
    manager.handleJoin(p3Socket as unknown as AppServerSocket, {
      tableId: table.tableId,
      nickname: playerThree.nickname,
      userId: playerThree.id
    });

    manager.handleStart(p2Socket as unknown as AppServerSocket, { tableId: table.tableId });
    expect(getErrorMessage(p2Socket, 0)).toBe('Only the host can perform this action');

    manager.handleStart(hostSocket as unknown as AppServerSocket, { tableId: table.tableId });
    expect(getErrorMessage(hostSocket)).toBe('仍有玩家未准备');

    manager.handleSetPrepared(hostSocket as unknown as AppServerSocket, { tableId: table.tableId, prepared: true });
    manager.handleSetPrepared(p2Socket as unknown as AppServerSocket, { tableId: table.tableId, prepared: true });
    manager.handleSetPrepared(p3Socket as unknown as AppServerSocket, { tableId: table.tableId, prepared: true });

    manager.handleStart(hostSocket as unknown as AppServerSocket, { tableId: table.tableId });

    const managed = manager.getManagedTable(table.tableId);
    if (!managed || !dealingCoordinator) {
      throw new Error('Table did not initialize correctly');
    }
    expect(managed.hasStarted).toBe(true);
    expect(derivePhaseStatus(managed.phase)).toBe('dealing');
    expect(Array.from(managed.prepared.values()).every(flag => flag === false)).toBe(true);
    expect(lobby.snapshot().rooms[0].status).toBe('in-progress');
  });

  it('waits for reconnect before removing a player from a started table', () => {
    vi.useFakeTimers();
    const { lobby, users, manager } = setupTableManager();
    const host = users.register('Host');
    const playerTwo = users.register('Player Two');
    const playerThree = users.register('Player Three');
    const table = manager.createTable(host, 'dou-dizhu');

    const hostSocket = new FakeSocket('socket-host', host.nickname);
    const p2Socket = new FakeSocket('socket-2', playerTwo.nickname);
    const p3Socket = new FakeSocket('socket-3', playerThree.nickname);

    manager.handleJoin(hostSocket as unknown as AppServerSocket, {
      tableId: table.tableId,
      nickname: host.nickname,
      userId: host.id
    });
    manager.handleJoin(p2Socket as unknown as AppServerSocket, {
      tableId: table.tableId,
      nickname: playerTwo.nickname,
      userId: playerTwo.id
    });
    manager.handleJoin(p3Socket as unknown as AppServerSocket, {
      tableId: table.tableId,
      nickname: playerThree.nickname,
      userId: playerThree.id
    });

    const managed = manager.getManagedTable(table.tableId);
    if (!managed) {
      throw new Error('Table missing after setup');
    }
    managed.hasStarted = true;
    managed.phase = { status: 'dealing' };

    manager.handleDisconnect(p2Socket.id);
    expect(managed.pendingDisconnects.size).toBe(1);
    expect(managed.state.seats).toContain(p2Socket.id);

    vi.advanceTimersByTime(4_000);
    expect(managed.state.seats).toContain(p2Socket.id);

    vi.advanceTimersByTime(2_000);
    expect(managed.state.seats).not.toContain(p2Socket.id);
    expect(managed.pendingDisconnects.size).toBe(0);
    expect(lobby.snapshot().rooms[0].players).toBe(2);
    vi.useRealTimers();
  });
});
