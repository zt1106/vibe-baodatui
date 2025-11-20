import { z } from 'zod';
import { AVATAR_FILENAMES } from './avatars';

export const DomainContractVersion = '2024-11-01';

const identifier = z.string().min(1);
const positiveInt = z.number().int().positive();
const nonNegativeInt = z.number().int().min(0);

const nicknameSchema = z.string().trim().min(1).max(32);
const avatarSchema = z.enum(AVATAR_FILENAMES);

export const TableId = identifier;
export const SeatId = identifier;
export const UserId = positiveInt;

const NotificationId = identifier;

export const PlayerIdentity = z.object({
    userId: UserId,
    nickname: nicknameSchema,
    avatar: avatarSchema
});

export const LobbyRoomStatus = z.enum(['waiting', 'in-progress', 'full']);

export const LobbyRoom = z.object({
    id: TableId,
    status: LobbyRoomStatus,
    players: nonNegativeInt,
    capacity: positiveInt
});

export const LobbyNotification = z.object({
    id: NotificationId,
    message: z.string().min(1),
    tone: z.enum(['info', 'warning'])
});

export const LobbyRoomsResponse = z.object({
    rooms: z.array(LobbyRoom),
    notifications: z.array(LobbyNotification)
});

export const TablePlayer = PlayerIdentity.extend({
    prepared: z.boolean()
});

export const TableHost = PlayerIdentity;

export const TableSeatState = PlayerIdentity.extend({
    seatId: SeatId,
    prepared: z.boolean(),
    handCount: nonNegativeInt.optional()
});

export const TableConfig = z.object({
    capacity: positiveInt
});

export const TablePrepareResponse = z.object({
    tableId: TableId,
    status: LobbyRoomStatus,
    host: TableHost,
    players: z.array(TablePlayer),
    config: TableConfig
});

export const UserPayload = z.object({
    id: UserId,
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
    userId: UserId,
    avatar: avatarSchema
});

export const UpdateAvatarResponse = RegisterUserResponse;

export const UpdateNicknameRequest = z.object({
    userId: UserId,
    nickname: nicknameSchema
});

export const UpdateNicknameResponse = RegisterUserResponse;

export const LoginUserRequest = RegisterUserRequest;
export const LoginUserResponse = RegisterUserResponse;

export const JoinTable = z.object({
    tableId: TableId,
    nickname: nicknameSchema,
    userId: UserId.optional()
});

export const CreateTableRequest = z.object({
    host: TableHost
});

export const TableStartRequest = z.object({
    tableId: TableId
});

export const TableKickRequest = z.object({
    tableId: TableId,
    userId: UserId
});

export const TableConfigUpdateRequest = z.object({
    tableId: TableId,
    capacity: z.number().int().min(2)
});

export const ServerState = z.object({
    tableId: TableId,
    status: LobbyRoomStatus,
    host: TableHost,
    config: TableConfig,
    seats: z.array(TableSeatState)
});

export const TablePreparedRequest = z.object({
    tableId: TableId,
    prepared: z.boolean()
});

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

export const GamePhase = z.enum(['idle', 'dealing', 'complete']);

export const GameSeatState = PlayerIdentity.extend({
    seatId: SeatId,
    handCount: nonNegativeInt,
    isHost: z.boolean()
});

export const GameSnapshot = z.object({
    tableId: TableId,
    phase: GamePhase,
    deckCount: nonNegativeInt,
    lastDealtSeatId: SeatId.optional(),
    seats: z.array(GameSeatState)
});

export const GameDealCardEvent = z.object({
    tableId: TableId,
    seatId: SeatId,
    card: GameCard
});

export const TablePlayStateResponse = z.object({
    snapshot: GameSnapshot,
    hand: z.array(GameCard)
});

export const DomainContracts = {
    version: DomainContractVersion,
    scalars: {
        TableId,
        SeatId,
        UserId
    },
    lobby: {
        LobbyRoomStatus,
        LobbyRoom,
        LobbyNotification,
        LobbyRoomsResponse
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
};
