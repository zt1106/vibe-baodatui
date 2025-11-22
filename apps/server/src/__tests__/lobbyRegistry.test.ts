import { describe, expect, it } from 'vitest';
import {
  createLobbyRegistry,
  deriveLobbyRoomStatus
} from '../infrastructure/lobbyRegistry';

const sampleRoom = {
  id: 'table-1',
  status: 'waiting' as const,
  players: 1,
  capacity: 4
};

const sampleNotification = {
  id: 'note-1',
  message: 'Welcome',
  tone: 'info' as const
};

describe('deriveLobbyRoomStatus', () => {
  it('returns waiting until capacity is reached', () => {
    expect(deriveLobbyRoomStatus(0, 4)).toBe('waiting');
    expect(deriveLobbyRoomStatus(3, 4)).toBe('waiting');
    expect(deriveLobbyRoomStatus(4, 4)).toBe('full');
    expect(deriveLobbyRoomStatus(6, 4)).toBe('full');
  });
});

describe('createLobbyRegistry', () => {
  it('hydrates from initial data and returns validated snapshot', () => {
    const registry = createLobbyRegistry({ rooms: [sampleRoom], notifications: [sampleNotification] });
    const snapshot = registry.snapshot();
    expect(snapshot.rooms).toEqual([sampleRoom]);
    expect(snapshot.notifications).toEqual([sampleNotification]);
  });

  it('upserts and removes rooms and notifications', () => {
    const registry = createLobbyRegistry();
    registry.upsertRoom(sampleRoom);
    registry.upsertRoom({ ...sampleRoom, id: 'table-2', players: 4, status: 'full' });

    registry.setNotification(sampleNotification);
    registry.setNotification({ ...sampleNotification, id: 'note-2', tone: 'warning' });

    expect(registry.listRooms()).toHaveLength(2);
    expect(registry.listNotifications()).toHaveLength(2);

    registry.removeRoom('table-1');
    registry.removeNotification('note-1');
    registry.clearNotifications();

    const snapshot = registry.snapshot();
    expect(snapshot.rooms.map(r => r.id)).toEqual(['table-2']);
    expect(snapshot.notifications).toEqual([]);
  });
});
