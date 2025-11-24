import { LobbyRoomsResponse } from '@shared/messages';
import type { LobbyNotification, LobbyRoom, LobbyRoomsResponse as LobbyRoomsSnapshot } from '@shared/messages';

export type { LobbyRoom, LobbyNotification } from '@shared/messages';

export type LobbyRegistrySnapshot = LobbyRoomsSnapshot;

type LobbyRoomRecord = LobbyRoom;
type LobbyNotificationRecord = LobbyNotification;

export function createLobbyRegistry(initial: Partial<LobbyRegistrySnapshot> = {}) {
  const rooms = new Map<string, LobbyRoomRecord>();
  const notifications = new Map<string, LobbyNotificationRecord>();

  if (initial.rooms) {
    for (const room of initial.rooms) {
      rooms.set(room.id, { ...room });
    }
  }

  if (initial.notifications) {
    for (const notification of initial.notifications) {
      notifications.set(notification.id, { ...notification });
    }
  }

  const listRooms = (): LobbyRoom[] => Array.from(rooms.values()).map(room => ({ ...room }));
  const listNotifications = (): LobbyNotification[] =>
    Array.from(notifications.values()).map(notification => ({ ...notification }));

  return {
    upsertRoom(room: LobbyRoom) {
      rooms.set(room.id, { ...room });
    },
    removeRoom(id: string) {
      rooms.delete(id);
    },
    setNotification(notification: LobbyNotification) {
      notifications.set(notification.id, { ...notification });
    },
    removeNotification(id: string) {
      notifications.delete(id);
    },
    clearNotifications() {
      notifications.clear();
    },
    listRooms,
    listNotifications,
    snapshot(): LobbyRegistrySnapshot {
      const payload = { rooms: listRooms(), notifications: listNotifications() };
      // ensure shape matches shared contract before returning
      return LobbyRoomsResponse.parse(payload);
    }
  };
}
