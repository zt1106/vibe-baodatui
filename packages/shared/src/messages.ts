import { z } from 'zod';

import { AVATAR_FILENAMES } from './avatars';

export const DomainContractVersion = '2024-12-01' as const;

const identifier = z.string().min(1);
const positiveInt = z.number().int().positive();
const nonNegativeInt = z.number().int().min(0);

const nicknameSchema = z.string().trim().min(1).max(32);
const avatarSchema = z.enum(AVATAR_FILENAMES);

export const TableId = identifier;
export type TableId = z.infer<typeof TableId>;

export const SeatId = identifier;
export type SeatId = z.infer<typeof SeatId>;

export const UserId = positiveInt;
export type UserId = z.infer<typeof UserId>;

export const GameVariantId = z.enum(['dou-dizhu']);
export type GameVariantId = z.infer<typeof GameVariantId>;

export const GameVariantCapacity = z
  .object({
    min: positiveInt,
    max: positiveInt,
    locked: positiveInt.optional()
  })
  .refine(value => value.min <= value.max, { message: 'min cannot exceed max' })
  .refine(value => !value.locked || (value.locked >= value.min && value.locked <= value.max), {
    message: 'locked capacity must be within range'
  });
export type GameVariantCapacity = z.infer<typeof GameVariantCapacity>;

export const GameVariantSummary = z.object({
  id: GameVariantId,
  name: z.string().min(1),
  description: z.string().min(1),
  capacity: GameVariantCapacity
});
export type GameVariantSummary = z.infer<typeof GameVariantSummary>;

const NotificationId = identifier;

export const PlayerIdentity = z.object({
  userId: UserId,
  nickname: nicknameSchema,
  avatar: avatarSchema
});
export type PlayerIdentity = z.infer<typeof PlayerIdentity>;

export const LobbyRoomStatus = z.enum(['waiting', 'in-progress', 'full']);
export type LobbyRoomStatus = z.infer<typeof LobbyRoomStatus>;

export const LobbyRoom = z.object({
  id: TableId,
  status: LobbyRoomStatus,
  players: nonNegativeInt,
  capacity: positiveInt,
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

export const Heartbeat = z.object({
  status: z.enum(['ok', 'degraded']),
  timestamp: nonNegativeInt,
  uptimeMs: nonNegativeInt,
  connections: nonNegativeInt
});
export type Heartbeat = z.infer<typeof Heartbeat>;

export const TablePlayer = PlayerIdentity.extend({
  prepared: z.boolean()
});
export type TablePlayer = z.infer<typeof TablePlayer>;

export const TableHost = PlayerIdentity;
export type TableHost = z.infer<typeof TableHost>;

export const TableSeatState = PlayerIdentity.extend({
  seatId: SeatId,
  prepared: z.boolean(),
  handCount: nonNegativeInt.optional()
});
export type TableSeatState = z.infer<typeof TableSeatState>;

export const TableConfig = z.object({
  capacity: positiveInt,
  variant: GameVariantSummary
});
export type TableConfig = z.infer<typeof TableConfig>;

export const TablePrepareResponse = z.object({
  tableId: TableId,
  status: LobbyRoomStatus,
  host: TableHost,
  players: z.array(TablePlayer),
  config: TableConfig
});
export type TablePrepareResponse = z.infer<typeof TablePrepareResponse>;

export const UserPayload = z.object({
  id: UserId,
  nickname: nicknameSchema,
  avatar: avatarSchema
});
export type UserPayload = z.infer<typeof UserPayload>;

export const RegisterUserRequest = z.object({
  nickname: nicknameSchema
});
export type RegisterUserRequest = z.infer<typeof RegisterUserRequest>;

export const RegisterUserResponse = z.object({
  user: UserPayload
});
export type RegisterUserResponse = z.infer<typeof RegisterUserResponse>;

export const UpdateAvatarRequest = z.object({
  userId: UserId,
  avatar: avatarSchema
});
export type UpdateAvatarRequest = z.infer<typeof UpdateAvatarRequest>;

export const UpdateAvatarResponse = RegisterUserResponse;
export type UpdateAvatarResponse = z.infer<typeof UpdateAvatarResponse>;

export const UpdateNicknameRequest = z.object({
  userId: UserId,
  nickname: nicknameSchema
});
export type UpdateNicknameRequest = z.infer<typeof UpdateNicknameRequest>;

export const UpdateNicknameResponse = RegisterUserResponse;
export type UpdateNicknameResponse = z.infer<typeof UpdateNicknameResponse>;

export const LoginUserRequest = RegisterUserRequest;
export type LoginUserRequest = z.infer<typeof LoginUserRequest>;

export const LoginUserResponse = RegisterUserResponse;
export type LoginUserResponse = z.infer<typeof LoginUserResponse>;

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
  capacity: z.number().int().min(2)
});
export type TableConfigUpdateRequest = z.infer<typeof TableConfigUpdateRequest>;

export const ServerState = z.object({
  tableId: TableId,
  status: LobbyRoomStatus,
  host: TableHost,
  config: TableConfig,
  seats: z.array(TableSeatState)
});
export type ServerState = z.infer<typeof ServerState>;

export const TablePreparedRequest = z.object({
  tableId: TableId,
  prepared: z.boolean()
});
export type TablePreparedRequest = z.infer<typeof TablePreparedRequest>;

const CardSuit = z.enum(['S', 'H', 'D', 'C', 'JB', 'JR']);
const CardRank = z.enum(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'Joker']);

const CardMeta = z
  .object({
    ownerSeat: nonNegativeInt.optional(),
    selectable: z.boolean().optional(),
    tags: z.array(z.string()).optional()
  })
  .partial();

export const GameCard = z.object({
  id: z.number().int().nonnegative(),
  rank: CardRank,
  suit: CardSuit,
  faceUp: z.boolean(),
  meta: CardMeta.optional()
});
export type GameCard = z.infer<typeof GameCard>;

export const GamePhase = z.enum(['idle', 'dealing', 'complete']);
export type GamePhase = z.infer<typeof GamePhase>;

export const GameSeatState = PlayerIdentity.extend({
  seatId: SeatId,
  handCount: nonNegativeInt,
  isHost: z.boolean()
});
export type GameSeatState = z.infer<typeof GameSeatState>;

export const GameSnapshot = z.object({
  tableId: TableId,
  phase: GamePhase,
  deckCount: nonNegativeInt,
  lastDealtSeatId: SeatId.optional(),
  variant: GameVariantSummary,
  seats: z.array(GameSeatState)
});
export type GameSnapshot = z.infer<typeof GameSnapshot>;

export const GameDealCardEvent = z.object({
  tableId: TableId,
  seatId: SeatId,
  card: GameCard
});
export type GameDealCardEvent = z.infer<typeof GameDealCardEvent>;

export const TablePlayStateResponse = z.object({
  snapshot: GameSnapshot,
  hand: z.array(GameCard)
});
export type TablePlayStateResponse = z.infer<typeof TablePlayStateResponse>;

export const DomainContracts = {
  version: DomainContractVersion,
  scalars: {
    TableId,
    SeatId,
    UserId
  },
  variants: {
    GameVariantId,
    GameVariantCapacity,
    GameVariantSummary
  },
  lobby: {
    LobbyRoomStatus,
    LobbyRoom,
    LobbyNotification,
    LobbyRoomsResponse
  },
  heartbeat: {
    Heartbeat
  },
  auth: {
    UserPayload,
    RegisterUserRequest,
    RegisterUserResponse,
    LoginUserRequest,
    LoginUserResponse,
    UpdateAvatarRequest,
    UpdateAvatarResponse,
    UpdateNicknameRequest,
    UpdateNicknameResponse
  },
  table: {
    PlayerIdentity,
    TablePlayer,
    TableSeatState,
    TableHost,
    TableConfig,
    TablePrepareResponse,
    TableConfigUpdateRequest,
    TableKickRequest,
    TablePreparedRequest,
    TableStartRequest,
    CreateTableRequest,
    JoinTable,
    ServerState
  },
  game: {
    CardSuit,
    CardRank,
    GameCard,
    GamePhase,
    GameSeatState,
    GameSnapshot,
    GameDealCardEvent,
    TablePlayStateResponse
  }
} as const;
export type DomainContracts = typeof DomainContracts;
