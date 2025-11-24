import { z } from 'zod';

import {
  GameVariantId,
  GameVariantSummary,
  SeatId,
  TableId,
  UserId,
  avatarSchema,
  nicknameSchema,
  nonNegativeIntSchema,
  positiveIntSchema
} from './common';
import { GameResult } from './gameResult';
import { LobbyRoomStatus } from './lobby';

export const PlayerIdentity = z.object({
  userId: UserId,
  nickname: nicknameSchema,
  avatar: avatarSchema
});
export type PlayerIdentity = z.infer<typeof PlayerIdentity>;

export const TablePlayer = PlayerIdentity.extend({
  prepared: z.boolean()
});
export type TablePlayer = z.infer<typeof TablePlayer>;

export const TableHost = PlayerIdentity;
export type TableHost = z.infer<typeof TableHost>;

export const TableSeatState = PlayerIdentity.extend({
  seatId: SeatId,
  prepared: z.boolean(),
  handCount: nonNegativeIntSchema.optional()
});
export type TableSeatState = z.infer<typeof TableSeatState>;

export const TableConfig = z.object({
  capacity: positiveIntSchema,
  variant: GameVariantSummary
});
export type TableConfig = z.infer<typeof TableConfig>;

export const TablePrepareResponse = z.object({
  tableId: TableId,
  status: LobbyRoomStatus,
  host: TableHost,
  players: z.array(TablePlayer),
  config: TableConfig,
  lastResult: GameResult.optional()
});
export type TablePrepareResponse = z.infer<typeof TablePrepareResponse>;

export const JoinTable = z.object({
  tableId: TableId,
  nickname: nicknameSchema,
  userId: UserId.optional()
});
export type JoinTable = z.infer<typeof JoinTable>;

export const CreateTableRequest = z.object({
  host: TableHost,
  variantId: GameVariantId
});
export type CreateTableRequest = z.infer<typeof CreateTableRequest>;

export const TableStartRequest = z.object({
  tableId: TableId
});
export type TableStartRequest = z.infer<typeof TableStartRequest>;

export const TableKickRequest = z.object({
  tableId: TableId,
  userId: UserId
});
export type TableKickRequest = z.infer<typeof TableKickRequest>;

export const TableConfigUpdateRequest = z.object({
  tableId: TableId,
  capacity: z.number().int().min(2),
  requestId: z.string().min(1).optional()
});
export type TableConfigUpdateRequest = z.infer<typeof TableConfigUpdateRequest>;

export const ServerState = z.object({
  tableId: TableId,
  status: LobbyRoomStatus,
  host: TableHost,
  config: TableConfig,
  seats: z.array(TableSeatState),
  lastResult: GameResult.optional()
});
export type ServerState = z.infer<typeof ServerState>;

export const TablePreparedRequest = z.object({
  tableId: TableId,
  prepared: z.boolean(),
  requestId: z.string().min(1).optional()
});
export type TablePreparedRequest = z.infer<typeof TablePreparedRequest>;
