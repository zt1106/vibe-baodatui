
import { z } from 'zod';

const nicknameSchema = z.string().trim().min(1).max(32);

export const LobbyRoomStatus = z.enum(['waiting', 'in-progress', 'full']);
export type LobbyRoomStatus = z.infer<typeof LobbyRoomStatus>;

export const LobbyRoom = z.object({
  id: z.string().min(1),
  status: LobbyRoomStatus,
  players: z.number().int().min(0),
  capacity: z.number().int().positive()
});
export type LobbyRoom = z.infer<typeof LobbyRoom>;

export const LobbyNotification = z.object({
  id: z.string().min(1),
  message: z.string().min(1),
  tone: z.enum(['info', 'warning'])
});
export type LobbyNotification = z.infer<typeof LobbyNotification>;

export const LobbyRoomsResponse = z.object({
  rooms: z.array(LobbyRoom),
  notifications: z.array(LobbyNotification)
});
export type LobbyRoomsResponse = z.infer<typeof LobbyRoomsResponse>;

export const TablePlayer = z.object({
  userId: z.number().int().positive(),
  nickname: nicknameSchema,
  chips: z.number().int().min(0)
});
export type TablePlayer = z.infer<typeof TablePlayer>;

export const TableConfig = z.object({
  capacity: z.number().int().positive(),
  minimumPlayers: z.number().int().min(0)
});
export type TableConfig = z.infer<typeof TableConfig>;

export const TablePrepareResponse = z.object({
  tableId: z.string().min(1),
  status: LobbyRoomStatus,
  players: z.array(TablePlayer),
  config: TableConfig
});
export type TablePrepareResponse = z.infer<typeof TablePrepareResponse>;

export const UserPayload = z.object({
  id: z.number().int().positive(),
  nickname: nicknameSchema
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

export const LoginUserRequest = RegisterUserRequest;
export type LoginUserRequest = z.infer<typeof LoginUserRequest>;

export const LoginUserResponse = RegisterUserResponse;
export type LoginUserResponse = z.infer<typeof LoginUserResponse>;

export const JoinTable = z.object({
  tableId: z.string().min(1),
  nickname: nicknameSchema,
  userId: z.number().int().positive().optional()
});
export type JoinTable = z.infer<typeof JoinTable>;

export const Bet = z.object({
  tableId: z.string().min(1),
  chips: z.number().int().min(0)
});
export type Bet = z.infer<typeof Bet>;

export const ServerState = z.object({
  tableId: z.string(),
  seats: z.array(z.object({
    id: z.string(),
    userId: z.number().int().positive(),
    nickname: nicknameSchema,
    chips: z.number().int()
  })),
  pot: z.number().int(),
});
export type ServerState = z.infer<typeof ServerState>;

export const Heartbeat = z.object({
  status: z.literal('ok'),
  timestamp: z.number().int(),
  uptimeMs: z.number().int().min(0),
  connections: z.number().int().min(0)
});
export type Heartbeat = z.infer<typeof Heartbeat>;
