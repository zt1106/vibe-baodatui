import { z } from 'zod';

import {
  GameVariantSummary,
  TableId,
  identifierSchema,
  nonNegativeIntSchema,
  positiveIntSchema
} from './common';

const NotificationId = identifierSchema;

export const LobbyRoomStatus = z.enum(['waiting', 'in-progress', 'full']);
export type LobbyRoomStatus = z.infer<typeof LobbyRoomStatus>;

export const LobbyRoom = z.object({
  id: TableId,
  status: LobbyRoomStatus,
  players: nonNegativeIntSchema,
  capacity: positiveIntSchema,
  variant: GameVariantSummary
});
export type LobbyRoom = z.infer<typeof LobbyRoom>;

export const LobbyNotification = z.object({
  id: NotificationId,
  message: z.string().min(1),
  tone: z.enum(['info', 'warning'])
});
export type LobbyNotification = z.infer<typeof LobbyNotification>;

export const LobbyRoomsResponse = z.object({
  rooms: z.array(LobbyRoom),
  notifications: z.array(LobbyNotification)
});
export type LobbyRoomsResponse = z.infer<typeof LobbyRoomsResponse>;

export function deriveLobbyRoomStatus(players: number, capacity: number): LobbyRoomStatus {
  if (players === 0) {
    return 'waiting';
  }
  if (players >= capacity) {
    return 'full';
  }
  return 'waiting';
}
