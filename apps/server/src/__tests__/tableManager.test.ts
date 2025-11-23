import { describe, expect, it, vi } from 'vitest';
import type { Server, Socket } from 'socket.io';
import { derivePhaseStatus } from '@shared/tablePhases';
import { TableManager } from '../domain/tableManager';
import { createLobbyRegistry } from '../infrastructure/lobbyRegistry';
import { createUserRegistry } from '../infrastructure/userRegistry';

class FakeSocket {
  id: string;
  emitted: Record<string, any[]> = {};
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

  emit(event: string, payload: any) {
    (this.emitted[event] ||= []).push(payload);
  }
}

class FakeIo {
  roomEmits: Record<string, Array<{ event: string; payload: any }>> = {};
  broadcasts: Array<{ event: string; payload: any }> = [];
  sockets = { sockets: new Map<string, FakeSocket>() };

  to(room: string) {
    return {
      emit: (event: string, payload: any) => {
        (this.roomEmits[room] ||= []).push({ event, payload });
      }
    };
  }

  emit(event: string, payload: any) {
    this.broadcasts.push({ event, payload });
  }
}

const setupTableManager = () => {
  const io = new FakeIo();
  const lobby = createLobbyRegistry();
  const users = createUserRegistry();
  const manager = new TableManager({ io: io as unknown as Server, lobby, users });
  return { io, lobby, users, manager };
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

    manager.handleJoin(hostSocket as unknown as Socket, {
      tableId: table.tableId,
      nickname: host.nickname,
      userId: host.id
    });
    expect(lobby.snapshot().rooms[0]).toMatchObject({ id: table.tableId, players: 1, status: 'waiting' });

    manager.handleJoin(p2Socket as unknown as Socket, {
      tableId: table.tableId,
      nickname: playerTwo.nickname,
      userId: playerTwo.id
    });
    manager.handleJoin(p3Socket as unknown as Socket, {
      tableId: table.tableId,
      nickname: playerThree.nickname,
      userId: playerThree.id
    });

    const filled = lobby.snapshot();
    expect(filled.rooms[0]).toMatchObject({ players: 3, status: 'full' });

    const leaveAck = vi.fn();
    manager.handleLeave(p2Socket as unknown as Socket, { tableId: table.tableId, userId: playerTwo.id }, leaveAck);
    expect(leaveAck).toHaveBeenCalledWith({ ok: true });
    expect(lobby.snapshot().rooms[0].players).toBe(2);

    manager.handleLeave(hostSocket as unknown as Socket, { tableId: table.tableId, userId: host.id });
    manager.handleLeave(p3Socket as unknown as Socket, { tableId: table.tableId, userId: playerThree.id });

    expect(lobby.snapshot().rooms).toHaveLength(0);
    expect(manager.getPrepareState(table.tableId)).toBeNull();
  });

  it('requires the host and prepared players before starting a game', () => {
    const { lobby, users, manager } = setupTableManager();
    const host = users.register('Host');
    const playerTwo = users.register('Player Two');
    const playerThree = users.register('Player Three');
    const table = manager.createTable(host, 'dou-dizhu');

    const hostSocket = new FakeSocket('socket-host', host.nickname);
    const p2Socket = new FakeSocket('socket-2', playerTwo.nickname);
    const p3Socket = new FakeSocket('socket-3', playerThree.nickname);

    manager.handleJoin(hostSocket as unknown as Socket, {
      tableId: table.tableId,
      nickname: host.nickname,
      userId: host.id
    });
    manager.handleJoin(p2Socket as unknown as Socket, {
      tableId: table.tableId,
      nickname: playerTwo.nickname,
      userId: playerTwo.id
    });
    manager.handleJoin(p3Socket as unknown as Socket, {
      tableId: table.tableId,
      nickname: playerThree.nickname,
      userId: playerThree.id
    });

    const dealingStub = vi
      .spyOn<any, any>(manager as any, 'startDouDizhuDealing')
      .mockImplementation((tableState: any) => {
        tableState.dealingState = null;
        tableState.phase = { status: 'dealing' };
      });

    manager.handleStart(p2Socket as unknown as Socket, { tableId: table.tableId });
    expect(p2Socket.emitted.errorMessage?.[0]?.message).toBe('Only the host can perform this action');

    manager.handleStart(hostSocket as unknown as Socket, { tableId: table.tableId });
    expect(hostSocket.emitted.errorMessage?.at(-1)?.message).toBe('仍有玩家未准备');

    manager.handleSetPrepared(hostSocket as unknown as Socket, { tableId: table.tableId, prepared: true });
    manager.handleSetPrepared(p2Socket as unknown as Socket, { tableId: table.tableId, prepared: true });
    manager.handleSetPrepared(p3Socket as unknown as Socket, { tableId: table.tableId, prepared: true });

    manager.handleStart(hostSocket as unknown as Socket, { tableId: table.tableId });

    const managed = (manager as any).tables.get(table.tableId);
    expect(managed.hasStarted).toBe(true);
    expect(derivePhaseStatus(managed.phase)).toBe('dealing');
    expect(Array.from(managed.prepared.values()).every(flag => flag === false)).toBe(true);
    expect(lobby.snapshot().rooms[0].status).toBe('in-progress');

    dealingStub.mockRestore();
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

    manager.handleJoin(hostSocket as unknown as Socket, {
      tableId: table.tableId,
      nickname: host.nickname,
      userId: host.id
    });
    manager.handleJoin(p2Socket as unknown as Socket, {
      tableId: table.tableId,
      nickname: playerTwo.nickname,
      userId: playerTwo.id
    });
    manager.handleJoin(p3Socket as unknown as Socket, {
      tableId: table.tableId,
      nickname: playerThree.nickname,
      userId: playerThree.id
    });

    const managed = (manager as any).tables.get(table.tableId);
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
