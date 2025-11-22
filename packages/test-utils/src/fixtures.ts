import { DEFAULT_AVATAR } from '@shared/avatars';
import {
  deriveLobbyRoomStatus,
  LobbyNotification as LobbyNotificationSchema,
  LobbyRoom as LobbyRoomSchema,
  LobbyRoomsResponse as LobbyRoomsResponseSchema,
  type LobbyNotification,
  type LobbyRoom,
  type LobbyRoomsResponse,
  type ServerState,
  type TableConfig,
  type TableHost,
  type TablePlayer,
  type TablePrepareResponse,
  type TableSeatState
} from '@shared/messages';
import { DEFAULT_VARIANT_ID, getVariantSummary } from '@shared/variants';

const DEFAULT_VARIANT = getVariantSummary(DEFAULT_VARIANT_ID);

function cloneVariant() {
  return { ...DEFAULT_VARIANT, capacity: { ...DEFAULT_VARIANT.capacity } };
}

export function makeTableHostFixture(overrides: Partial<TableHost> = {}): TableHost {
  return {
    userId: 1,
    nickname: 'Host',
    avatar: DEFAULT_AVATAR,
    ...overrides
  };
}

export function makeTableConfigFixture(overrides: Partial<TableConfig> = {}): TableConfig {
  const variant = overrides.variant ?? cloneVariant();
  const defaultCapacity =
    overrides.capacity ??
    variant.capacity.locked ??
    variant.capacity.max ??
    variant.capacity.min;
  return {
    capacity: defaultCapacity,
    variant,
    ...overrides
  };
}

export function makeTablePlayerFixture(index = 1, overrides: Partial<TablePlayer> = {}): TablePlayer {
  return {
    userId: index,
    nickname: `Player ${index}`,
    avatar: DEFAULT_AVATAR,
    prepared: false,
    ...overrides
  };
}

export function makeTableSeatFixture(index = 1, overrides: Partial<TableSeatState> = {}): TableSeatState {
  return {
    seatId: `seat-${index}`,
    userId: index,
    nickname: `Player ${index}`,
    avatar: DEFAULT_AVATAR,
    prepared: false,
    handCount: 0,
    ...overrides
  };
}

export function makeServerStateFixture(overrides: Partial<ServerState> = {}): ServerState {
  const config = makeTableConfigFixture(overrides.config);
  const seats = overrides.seats ?? [makeTableSeatFixture(1), makeTableSeatFixture(2)];
  const status = overrides.status ?? deriveLobbyRoomStatus(seats.length, config.capacity);
  const host = overrides.host ?? makeTableHostFixture();
  return {
    tableId: overrides.tableId ?? 'table-1',
    status,
    host,
    config,
    seats,
    ...overrides
  };
}

export function makeTablePrepareFixture(
  overrides: Partial<TablePrepareResponse> = {}
): TablePrepareResponse {
  const host = overrides.host ?? makeTableHostFixture();
  const config = makeTableConfigFixture(overrides.config);
  const players =
    overrides.players ??
    [
      makeTablePlayerFixture(1, { userId: host.userId, nickname: host.nickname }),
      makeTablePlayerFixture(2, { userId: 2, nickname: 'Guest' })
    ];
  const status = overrides.status ?? deriveLobbyRoomStatus(players.length, config.capacity);
  return {
    tableId: overrides.tableId ?? 'table-1',
    status,
    host,
    players,
    config,
    ...overrides
  };
}

export function makeLobbyRoomFixture(overrides: Partial<LobbyRoom> = {}): LobbyRoom {
  const variant = overrides.variant ?? cloneVariant();
  const capacity =
    overrides.capacity ?? variant.capacity.locked ?? variant.capacity.max ?? variant.capacity.min;
  const players = overrides.players ?? Math.min(1, capacity);
  return LobbyRoomSchema.parse({
    id: overrides.id ?? 'room-1',
    status: overrides.status ?? deriveLobbyRoomStatus(players, capacity),
    players,
    capacity,
    variant,
    ...overrides
  });
}

export function makeLobbyNotificationFixture(
  overrides: Partial<LobbyNotification> = {}
): LobbyNotification {
  return LobbyNotificationSchema.parse({
    id: overrides.id ?? 'note-1',
    message: overrides.message ?? 'Welcome to the lobby',
    tone: overrides.tone ?? 'info',
    ...overrides
  });
}

export function makeLobbyRoomsResponseFixture(
  overrides: Partial<LobbyRoomsResponse> = {}
): LobbyRoomsResponse {
  const rooms = overrides.rooms ?? [makeLobbyRoomFixture()];
  const notifications = overrides.notifications ?? [makeLobbyNotificationFixture()];
  return LobbyRoomsResponseSchema.parse({
    rooms,
    notifications,
    ...overrides
  });
}
