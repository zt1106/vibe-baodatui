import { z } from 'zod';

const nicknameSchema = z.string().trim().min(1).max(32);

export const LobbyRoomStatus = z.enum(['waiting', 'in-progress', 'full']);

export const LobbyRoom = z.object({
    id: z.string().min(1),
    status: LobbyRoomStatus,
    players: z.number().int().min(0),
    capacity: z.number().int().positive()
});

export const LobbyNotification = z.object({
    id: z.string().min(1),
    message: z.string().min(1),
    tone: z.enum(['info', 'warning'])
});

export const LobbyRoomsResponse = z.object({
    rooms: z.array(LobbyRoom),
    notifications: z.array(LobbyNotification)
});

export const TablePlayer = z.object({
    userId: z.number().int().positive(),
    nickname: nicknameSchema
});

export const TableConfig = z.object({
    capacity: z.number().int().positive(),
    minimumPlayers: z.number().int().min(0)
});

export const TablePrepareResponse = z.object({
    tableId: z.string().min(1),
    status: LobbyRoomStatus,
    players: z.array(TablePlayer),
    config: TableConfig
});

export const UserPayload = z.object({
    id: z.number().int().positive(),
    nickname: nicknameSchema
});

export const RegisterUserRequest = z.object({
    nickname: nicknameSchema
});

export const RegisterUserResponse = z.object({
    user: UserPayload
});

export const LoginUserRequest = RegisterUserRequest;

export const LoginUserResponse = RegisterUserResponse;

export const JoinTable = z.object({
    tableId: z.string().min(1),
    nickname: nicknameSchema,
    userId: z.number().int().positive().optional()
});

export const ServerState = z.object({
    tableId: z.string(),
    seats: z.array(z.object({
        id: z.string(),
        userId: z.number().int().positive(),
        nickname: nicknameSchema
    }))
});

export const Heartbeat = z.object({
    status: z.literal('ok'),
    timestamp: z.number().int(),
    uptimeMs: z.number().int().min(0),
    connections: z.number().int().min(0)
});
