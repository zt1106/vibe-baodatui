export * from './common';
export * from './auth';
export * from './lobby';
export * from './table';
export * from './game';
export * from './gameResult';

import {
  DomainContractVersion,
  GameVariantCapacity,
  GameVariantId,
  GameVariantSummary,
  Heartbeat,
  SeatId,
  TableId,
  UserId
} from './common';
import {
  LoginUserRequest,
  LoginUserResponse,
  RegisterUserRequest,
  RegisterUserResponse,
  UpdateAvatarRequest,
  UpdateAvatarResponse,
  UpdateNicknameRequest,
  UpdateNicknameResponse,
  UserPayload
} from './auth';
import {
  LobbyNotification,
  LobbyRoom,
  LobbyRoomsResponse,
  LobbyRoomStatus,
  deriveLobbyRoomStatus
} from './lobby';
import {
  CreateTableRequest,
  JoinTable,
  PlayerIdentity,
  ServerState,
  TableConfig,
  TableConfigUpdateRequest,
  TableHost,
  TableKickRequest,
  TablePlayer,
  TablePrepareResponse,
  TablePreparedRequest,
  TableSeatState,
  TableStartRequest
} from './table';
import {
  CardRank,
  CardSuit,
  GameCard,
  GameDealCardEvent,
  GamePhase,
  GameSeatState,
  GameSnapshot,
  TablePlayStateResponse
} from './game';
import { GameResult } from './gameResult';

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
    LobbyRoomsResponse,
    deriveLobbyRoomStatus
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
    TablePlayStateResponse,
    GameResult
  }
} as const;
export type DomainContracts = typeof DomainContracts;
