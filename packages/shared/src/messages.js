import { z } from 'zod';
import { AVATAR_FILENAMES } from './avatars';

const nicknameSchema = z.string().trim().min(1).max(32);
const avatarSchema = z.enum(AVATAR_FILENAMES);

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
    nickname: nicknameSchema,
    avatar: avatarSchema,
    prepared: z.boolean()
});
export const TableHost = z.object({
    userId: z.number().int().positive(),
    nickname: nicknameSchema,
    avatar: avatarSchema
});

export const TableConfig = z.object({
    capacity: z.number().int().positive()
});

export const TablePrepareResponse = z.object({
    tableId: z.string().min(1),
    status: LobbyRoomStatus,
    host: TableHost,
    players: z.array(TablePlayer),
    config: TableConfig
});

export const UserPayload = z.object({
    id: z.number().int().positive(),
    nickname: nicknameSchema,
    avatar: avatarSchema
});

export const RegisterUserRequest = z.object({
    nickname: nicknameSchema
});

export const RegisterUserResponse = z.object({
    user: UserPayload
});

export const UpdateAvatarRequest = z.object({
    userId: z.number().int().positive(),
    avatar: avatarSchema
});

export const UpdateAvatarResponse = RegisterUserResponse;

export const UpdateNicknameRequest = z.object({
    userId: z.number().int().positive(),
    nickname: nicknameSchema
});

export const UpdateNicknameResponse = RegisterUserResponse;

export const LoginUserRequest = RegisterUserRequest;

export const LoginUserResponse = RegisterUserResponse;

export const JoinTable = z.object({
    tableId: z.string().min(1),
    nickname: nicknameSchema,
    userId: z.number().int().positive().optional()
});
export const CreateTableRequest = z.object({
    host: TableHost
});
export const TableStartRequest = z.object({
    tableId: z.string().min(1)
});
export const TableKickRequest = z.object({
    tableId: z.string().min(1),
    userId: z.number().int().positive()
});
export const TableConfigUpdateRequest = z.object({
    tableId: z.string().min(1),
    capacity: z.number().int().min(2)
});

export const ServerState = z.object({
    tableId: z.string(),
    status: LobbyRoomStatus,
    host: TableHost,
    config: TableConfig,
    seats: z.array(z.object({
        id: z.string(),
        userId: z.number().int().positive(),
        nickname: nicknameSchema,
        avatar: avatarSchema,
        prepared: z.boolean(),
        handCount: z.number().int().min(0).optional()
    }))
});

export const Heartbeat = z.object({
    status: z.literal('ok'),
    timestamp: z.number().int(),
    uptimeMs: z.number().int().min(0),
    connections: z.number().int().min(0)
});
export const TablePreparedRequest = z.object({
    tableId: z.string().min(1),
    prepared: z.boolean()
});

const CardSuit = z.enum(['S', 'H', 'D', 'C', 'JB', 'JR']);
const CardRank = z.enum(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'Joker']);

export const GameCard = z.object({
    id: z.number().int().nonnegative(),
    rank: CardRank,
    suit: CardSuit,
    faceUp: z.boolean()
});

export const GamePhase = z.enum(['idle', 'dealing', 'complete']);

export const GameSeatState = z.object({
    seatId: z.string().min(1),
    userId: z.number().int().positive(),
    nickname: nicknameSchema,
    avatar: avatarSchema,
    handCount: z.number().int().min(0),
    isHost: z.boolean()
});

export const GameSnapshot = z.object({
    tableId: z.string().min(1),
    phase: GamePhase,
    deckCount: z.number().int().min(0),
    lastDealtSeatId: z.string().min(1).optional(),
    seats: z.array(GameSeatState)
});

export const GameDealCardEvent = z.object({
    tableId: z.string().min(1),
    seatId: z.string().min(1),
    card: GameCard
});

export const TablePlayStateResponse = z.object({
    snapshot: GameSnapshot,
    hand: z.array(GameCard)
});
