import { randomUUID } from 'crypto';
import {
  GameDealCardEvent,
  deriveLobbyRoomStatus,
  GameSnapshot,
  GameVariantId,
  GameVariantSummary,
  ServerState,
  TablePlayStateResponse,
  TablePrepareResponse
} from '@shared/messages';
import type { AppServer, AppServerSocket } from '@shared/events';
import { createTable, joinTable, clearHands, resetDeck, drawCard } from '@game-core/engine';
import { DEFAULT_AVATAR, type AvatarFilename } from '@shared/avatars';
import {
  GAME_VARIANTS_BY_ID,
  getVariantDefinition,
  getVariantSummary,
  type GameVariantDefinition
} from '@shared/variants';
import {
  derivePhaseStatus,
  initialTablePhase,
  tablePhaseReducer,
  type TablePhase
} from '@shared/tablePhases';
import { createLobbyRegistry } from '../infrastructure/lobbyRegistry';
import {
  DuplicateNicknameError,
  UserNotFoundError,
  createUserRegistry
} from '../infrastructure/userRegistry';

export type ManagedTable = {
  id: string;
  state: ReturnType<typeof createTable>;
  config: {
    capacity: number;
    variant: GameVariantSummary;
  };
  variant: GameVariantDefinition;
  host: {
    userId: number;
    nickname: string;
  };
  hasStarted: boolean;
  prepared: Map<number, boolean>;
  phase: TablePhase;
  dealingState: {
    timer: NodeJS.Timeout | null;
    seatIndex: number;
    traceId?: string;
  } | null;
  pendingDisconnects: Map<number, NodeJS.Timeout>;
  variantState: Record<string, unknown>;
};

export type TableManagerDeps = {
  io: AppServer;
  lobby: ReturnType<typeof createLobbyRegistry>;
  users: ReturnType<typeof createUserRegistry>;
};

const DEAL_DELAY_MS = 600;
const RECONNECT_GRACE_MS = 5_000;

export const normalizeTableId = (id: string) => id.trim();

export class TableManager {
  private readonly io: AppServer;
  private readonly lobby: ReturnType<typeof createLobbyRegistry>;
  private readonly users: ReturnType<typeof createUserRegistry>;
  private readonly tables = new Map<string, ManagedTable>();
  private readonly socketTable = new Map<string, string>();
  private readonly socketUsers = new Map<string, number>();
  private readonly USER_AVATAR_FALLBACK: AvatarFilename = DEFAULT_AVATAR;

  constructor(deps: TableManagerDeps) {
    this.io = deps.io;
    this.lobby = deps.lobby;
    this.users = deps.users;
  }

  private transitionPhase(table: ManagedTable, action: Parameters<typeof tablePhaseReducer>[1]) {
    table.phase = tablePhaseReducer(table.phase, action);
    return table.phase;
  }

  private resolveRequestId(requestId?: string) {
    if (typeof requestId === 'string' && requestId.trim()) {
      return requestId.trim();
    }
    return randomUUID();
  }

  private logStructured(event: string, context: Record<string, unknown>) {
    console.info('[table]', { event, ...context });
  }

  getActiveTableIds() {
    return Array.from(this.tables.keys());
  }

  private resolveUserAvatar(userId: number): AvatarFilename {
    const record = this.users.findById(userId);
    return record?.avatar ?? this.USER_AVATAR_FALLBACK;
  }

  private generateTableId() {
    let id = '';
    do {
      id = `room-${randomUUID().slice(0, 8)}`;
    } while (this.tables.has(id));
    return id;
  }

  private ensureHostAction(socket: AppServerSocket, tableId: string) {
    const managed = this.tables.get(tableId);
    if (!managed) {
      socket.emit('errorMessage', { message: 'Unknown table' });
      return null;
    }
    const userId = this.socketUsers.get(socket.id);
    if (userId !== managed.host.userId) {
      socket.emit('errorMessage', { message: 'Only the host can perform this action' });
      return null;
    }
    return managed;
  }

  private resetTablePhaseIfNeeded(table: ManagedTable) {
    const wasStarted = table.hasStarted;
    if (table.state.seats.length < table.config.capacity) {
      this.endGameAndReset(table, wasStarted ? 'player-left' : undefined);
    }
  }

  private endGameAndReset(table: ManagedTable, reason: 'player-left' | 'manual-reset' | undefined) {
    table.hasStarted = false;
    this.transitionPhase(table, { type: 'reset' });
    this.stopDealing(table);
    clearHands(table.state);
    resetDeck(table.state, { packs: table.variant.deck.packs });
    this.setAllPrepared(table, false);
    table.variantState = {};
    this.emitGameSnapshot(table);
    if (reason) {
      this.io.to(table.id).emit('game:ended', { tableId: table.id, reason });
    }
  }

  private setAllPrepared(table: ManagedTable, prepared: boolean) {
    for (const seatId of table.state.seats) {
      const player = table.state.players[seatId];
      if (player) {
        table.prepared.set(player.userId, prepared);
      }
    }
  }

  private allPlayersPrepared(table: ManagedTable) {
    for (const seatId of table.state.seats) {
      const player = table.state.players[seatId];
      if (!player) continue;
      if (!table.prepared.get(player.userId)) {
        return false;
      }
    }
    return table.state.seats.length > 0;
  }

  private stopDealing(table: ManagedTable) {
    const timer = table.dealingState?.timer;
    if (timer) {
      clearTimeout(timer);
    }
    table.dealingState = null;
  }

  private buildGameSnapshot(table: ManagedTable, lastDealtSeatId?: string): GameSnapshot {
    return {
      tableId: table.id,
      phase: derivePhaseStatus(table.phase),
      deckCount: table.state.deck.length,
      lastDealtSeatId,
      variant: table.config.variant,
      seats: table.state.seats
        .map(seatId => {
          const player = table.state.players[seatId];
          if (!player) return null;
          return {
            seatId,
            userId: player.userId,
            nickname: player.nickname,
            avatar: this.resolveUserAvatar(player.userId),
            handCount: player.hand.length,
            isHost: table.host.userId === player.userId
          };
        })
        .filter((seat): seat is NonNullable<typeof seat> => Boolean(seat))
    };
  }

  private emitGameSnapshot(table: ManagedTable, lastDealtSeatId?: string) {
    const snapshot = this.buildGameSnapshot(table, lastDealtSeatId);
    this.io.to(table.id).emit('game:snapshot', snapshot);
    return snapshot;
  }

  private finishDealing(table: ManagedTable) {
    this.stopDealing(table);
    this.transitionPhase(table, { type: 'complete', reason: 'deck-depleted' });
    this.emitGameSnapshot(table);
  }

  private finishDouDizhuDealing(table: ManagedTable) {
    this.stopDealing(table);
    table.variantState = {
      ...table.variantState,
      bottomCards: table.state.deck.map(card => ({ ...card }))
    };
    this.transitionPhase(table, { type: 'complete', reason: 'bottom-cards' });
    this.emitGameSnapshot(table);
  }

  private startDouDizhuDealing(table: ManagedTable) {
    if (table.state.seats.length === 0) {
      return;
    }
    this.stopDealing(table);
    const traceId = this.resolveRequestId();
    this.transitionPhase(table, { type: 'start-dealing', traceId });
    table.dealingState = { timer: null, seatIndex: 0, traceId };
    this.logStructured('deal:start', {
      traceId,
      tableId: table.id,
      hostUserId: table.host.userId,
      variant: table.variant.id,
      mode: 'dou-dizhu',
      seats: table.state.seats.length,
      deckCount: table.state.deck.length
    });
    this.emitGameSnapshot(table);
    const tick = () => {
      if (!table.dealingState) {
        return;
      }
      const seats = table.state.seats;
      if (seats.length === 0) {
        this.transitionPhase(table, { type: 'reset' });
        this.stopDealing(table);
        this.emitGameSnapshot(table);
        return;
      }
      if (table.state.deck.length <= 3) {
        this.finishDouDizhuDealing(table);
        return;
      }
      const currentIndex = table.dealingState.seatIndex % seats.length;
      const seatId = seats[currentIndex];
      const card = drawCard(table.state, seatId);
      if (!card) {
        table.dealingState.seatIndex = (currentIndex + 1) % seats.length;
        table.dealingState.timer = setTimeout(tick, DEAL_DELAY_MS);
        return;
      }
      card.faceUp = true;
      const payload: GameDealCardEvent = {
        tableId: table.id,
        seatId,
        card
      };
      this.io.to(seatId).emit('game:deal', payload);
      this.emitState(table.id);
      this.emitGameSnapshot(table, seatId);
      table.dealingState.seatIndex = (currentIndex + 1) % seats.length;
      table.dealingState.timer = setTimeout(tick, DEAL_DELAY_MS);
    };
    table.dealingState.timer = setTimeout(tick, DEAL_DELAY_MS);
  }

  private startDealing(table: ManagedTable) {
    if (table.state.seats.length === 0) {
      return;
    }
    this.stopDealing(table);
    const traceId = this.resolveRequestId();
    this.transitionPhase(table, { type: 'start-dealing', traceId });
    table.dealingState = { timer: null, seatIndex: 0, traceId };
    this.logStructured('deal:start', {
      traceId,
      tableId: table.id,
      hostUserId: table.host.userId,
      variant: table.variant.id,
      mode: 'classic',
      seats: table.state.seats.length,
      deckCount: table.state.deck.length
    });
    this.emitGameSnapshot(table);
    const tick = () => {
      if (!table.dealingState) {
        return;
      }
      const seats = table.state.seats;
      if (seats.length === 0) {
        this.transitionPhase(table, { type: 'reset' });
        this.stopDealing(table);
        this.emitGameSnapshot(table);
        return;
      }
      if (table.state.deck.length === 0) {
        this.finishDealing(table);
        return;
      }
      const currentIndex = table.dealingState.seatIndex % seats.length;
      const seatId = seats[currentIndex];
      const card = drawCard(table.state, seatId);
      if (!card) {
        table.dealingState.seatIndex = (currentIndex + 1) % seats.length;
        table.dealingState.timer = setTimeout(tick, DEAL_DELAY_MS);
        return;
      }
      card.faceUp = true;
      const payload: GameDealCardEvent = {
        tableId: table.id,
        seatId,
        card
      };
      this.io.to(seatId).emit('game:deal', payload);
      this.emitState(table.id);
      this.emitGameSnapshot(table, seatId);
      table.dealingState.seatIndex = (currentIndex + 1) % seats.length;
      table.dealingState.timer = setTimeout(tick, DEAL_DELAY_MS);
    };
    table.dealingState.timer = setTimeout(tick, DEAL_DELAY_MS);
  }

  private startClassicVariant(table: ManagedTable) {
    table.hasStarted = true;
    const dealSeed = `deal-${table.id}-${Date.now()}`;
    resetDeck(table.state, { seed: dealSeed, packs: table.variant.deck.packs });
    clearHands(table.state);
    this.setAllPrepared(table, false);
    table.variantState = {};
    this.updateLobbyFromState(table.id);
    this.emitState(table.id);
    this.startDealing(table);
  }

  private startDouDizhuVariant(table: ManagedTable) {
    table.hasStarted = true;
    const dealSeed = `deal-${table.id}-${Date.now()}`;
    resetDeck(table.state, { seed: dealSeed, packs: table.variant.deck.packs });
    clearHands(table.state);
    this.setAllPrepared(table, false);
    table.variantState = {};
    this.updateLobbyFromState(table.id);
    this.emitState(table.id);
    this.startDouDizhuDealing(table);
  }

  private variantStartHandlers: Partial<Record<GameVariantId, (table: ManagedTable) => void>> = {
    'dou-dizhu': (table) => this.startDouDizhuVariant(table)
  };

  private startVariantGame(table: ManagedTable) {
    const handler = this.variantStartHandlers[table.variant.id] ?? ((t: ManagedTable) => this.startClassicVariant(t));
    handler(table);
  }

  private getTableStatus(managed: ManagedTable) {
    const {
      state,
      config: { capacity },
      hasStarted
    } = managed;
    if (hasStarted) {
      return 'in-progress' as const;
    }
    return deriveLobbyRoomStatus(state.seats.length, capacity);
  }

  private updateLobbyFromState(tableId: string) {
    const managed = this.tables.get(tableId);
    if (!managed) return;
    const {
      state,
      config: { capacity }
    } = managed;
    managed.config.variant = getVariantSummary(managed.variant.id);
    const status = this.getTableStatus(managed);
    this.lobby.upsertRoom({
      id: tableId,
      capacity,
      players: state.seats.length,
      status,
      variant: managed.config.variant
    });
  }

  private buildPreparePayload(table: ManagedTable) {
    const status = this.getTableStatus(table);
    return TablePrepareResponse.parse({
      tableId: table.id,
      status,
      host: {
        userId: table.host.userId,
        nickname: table.host.nickname,
        avatar: this.resolveUserAvatar(table.host.userId)
      },
      players: table.state.seats
        .map(playerId => table.state.players[playerId])
        .filter((player): player is NonNullable<typeof player> => Boolean(player))
        .map(player => ({
          userId: player.userId,
          nickname: player.nickname,
          avatar: this.resolveUserAvatar(player.userId),
          prepared: table.prepared.get(player.userId) ?? false
        })),
      config: {
        capacity: table.config.capacity,
        variant: table.config.variant
      }
    });
  }

  private removePlayerSeat(table: ManagedTable, seatId: string, departingUserId?: number) {
    const index = table.state.seats.indexOf(seatId);
    if (index === -1) {
      return;
    }
    table.state.seats.splice(index, 1);
    delete table.state.players[seatId];
    if (typeof departingUserId === 'number') {
      table.prepared.delete(departingUserId);
      const pendingTimer = table.pendingDisconnects.get(departingUserId);
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        table.pendingDisconnects.delete(departingUserId);
      }
    }
    if (table.state.seats.length === 0) {
      this.stopDealing(table);
      this.tables.delete(table.id);
      table.pendingDisconnects.forEach(timer => clearTimeout(timer));
      table.pendingDisconnects.clear();
      this.lobby.removeRoom(table.id);
      return;
    }
    this.promoteNewHostIfNeeded(table, departingUserId);
    this.resetTablePhaseIfNeeded(table);
    this.updateLobbyFromState(table.id);
    this.emitState(table.id);
  }

  private cleanupPlayerSocket(socketId: string) {
    const tableId = this.socketTable.get(socketId);
    const userId = this.socketUsers.get(socketId);
    this.socketTable.delete(socketId);
    this.socketUsers.delete(socketId);
    if (!tableId) {
      return;
    }
    const managed = this.tables.get(tableId);
    if (!managed) {
      return;
    }
    const seatIndex = managed.state.seats.indexOf(socketId);
    if (seatIndex === -1) {
      return;
    }
    const departingUserId = managed.state.players[socketId]?.userId ?? userId;
    if (managed.hasStarted && typeof departingUserId === 'number') {
      const existingTimer = managed.pendingDisconnects.get(departingUserId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      const timer = setTimeout(() => {
        managed.pendingDisconnects.delete(departingUserId);
        const currentSeatId = managed.state.seats.find(
          id => managed.state.players[id]?.userId === departingUserId
        );
        if (!currentSeatId || currentSeatId !== socketId) {
          return;
        }
        this.removePlayerSeat(managed, socketId, departingUserId);
      }, RECONNECT_GRACE_MS);
      managed.pendingDisconnects.set(departingUserId, timer);
      return;
    }
    this.removePlayerSeat(managed, socketId, departingUserId);
  }

  private promoteNewHostIfNeeded(table: ManagedTable, departingUserId?: number) {
    if (table.state.seats.length === 0) {
      return;
    }
    if (departingUserId == null || table.host.userId !== departingUserId) {
      return;
    }
    const nextSeatId = table.state.seats[0];
    const nextPlayer = table.state.players[nextSeatId];
    if (!nextPlayer) {
      return;
    }
    table.host = { userId: nextPlayer.userId, nickname: nextPlayer.nickname };
  }

  private createManagedTable(
    host: { id: number; nickname: string },
    variantId: GameVariantId,
    id = this.generateTableId()
  ): ManagedTable {
    const normalizedId = normalizeTableId(id);
    if (!normalizedId) {
      throw new Error('Invalid table id');
    }
    if (this.tables.has(normalizedId)) {
      throw new Error(`Table ${normalizedId} already exists`);
    }
    const variant = getVariantDefinition(variantId);
    const variantSummary = getVariantSummary(variant.id);
    const defaultCapacity = variant.capacity.locked ?? variant.capacity.default;
    const state = createTable(normalizedId, `seed-${normalizedId}`);
    resetDeck(state, { packs: variant.deck.packs });
    const managed: ManagedTable = {
      id: normalizedId,
      state,
      config: {
        capacity: defaultCapacity,
        variant: variantSummary
      },
      variant,
      host: {
        userId: host.id,
        nickname: host.nickname
      },
      hasStarted: false,
      prepared: new Map(),
      phase: initialTablePhase,
      dealingState: null,
      pendingDisconnects: new Map(),
      variantState: {}
    };
    this.tables.set(normalizedId, managed);
    this.updateLobbyFromState(normalizedId);
    return managed;
  }

  createTable(host: { id: number; nickname: string }, variantId: GameVariantId) {
    if (!GAME_VARIANTS_BY_ID[variantId]) {
      throw new Error('Unknown game variant');
    }
    const table = this.createManagedTable(host, variantId);
    return this.buildPreparePayload(table);
  }

  getPrepareState(tableId: string) {
    const requestedId = normalizeTableId(tableId);
    const table = this.tables.get(requestedId);
    if (!table) {
      return null;
    }
    return this.buildPreparePayload(table);
  }

  getPlayState(tableId: string, userId: number) {
    const requestedId = normalizeTableId(tableId);
    if (!requestedId) {
      throw new Error('Invalid table id');
    }
    const table = this.tables.get(requestedId);
    if (!table) {
      return null;
    }
    const seatId = table.state.seats.find(id => table.state.players[id]?.userId === userId);
    if (!seatId) {
      return null;
    }
    const player = table.state.players[seatId];
    if (!player) {
      return null;
    }
    return TablePlayStateResponse.parse({
      snapshot: this.buildGameSnapshot(table),
      hand: player.hand.map(card => ({ ...card }))
    });
  }

  emitState(tableId: string) {
    const table = this.tables.get(tableId);
    if (!table) return;
    const status = this.getTableStatus(table);
    const snapshot: ServerState = {
      tableId: table.id,
      status,
      host: {
        userId: table.host.userId,
        nickname: table.host.nickname,
        avatar: this.resolveUserAvatar(table.host.userId)
      },
      config: table.config,
      seats: table.state.seats
        .map(id => table.state.players[id])
        .filter((player): player is NonNullable<typeof player> => Boolean(player))
        .map(player => ({
          seatId: player.seatId ?? player.id,
          userId: player.userId,
          nickname: player.nickname,
          avatar: this.resolveUserAvatar(player.userId),
          prepared: table.prepared.get(player.userId) ?? false,
          handCount: player.hand.length
        }))
    };
    this.io.emit('state', snapshot);
  }

  broadcastAllStates() {
    this.tables.forEach((_table, tableId) => this.emitState(tableId));
  }

  handleJoin(socket: AppServerSocket, payload: { tableId?: string; nickname?: string; userId?: number }) {
    const tableId = normalizeTableId(payload.tableId ?? '');
    const table = this.tables.get(tableId);
    if (!table) {
      socket.emit('errorMessage', { message: 'Unknown table' });
      return;
    }
    const nickname = payload.nickname ?? '';
    const requestedUserId = payload.userId;

    let user;
    try {
      if (typeof requestedUserId === 'number') {
        const existing = this.users.findById(requestedUserId);
        if (!existing || existing.nickname.trim().toLowerCase() !== nickname.trim().toLowerCase()) {
          socket.emit('errorMessage', { message: 'Invalid user credentials for table join' });
          return;
        }
        user = existing;
      } else {
        try {
          user = this.users.register(nickname);
        } catch (error) {
          if (error instanceof DuplicateNicknameError) {
            user = this.users.login(nickname);
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      if (error instanceof DuplicateNicknameError) {
        socket.emit('errorMessage', { message: 'Nickname already registered' });
      } else if (error instanceof UserNotFoundError) {
        socket.emit('errorMessage', { message: 'Nickname not registered' });
      } else {
        console.error('[server] failed to process joinTable', error);
        socket.emit('errorMessage', { message: 'Failed to join table' });
      }
      return;
    }

    const seatForUser = table.state.seats.find(id => table.state.players[id]?.userId === user.id);

    if (table.hasStarted) {
      if (!seatForUser) {
        socket.emit('errorMessage', { message: '牌局已开始，暂无法加入' });
        return;
      }
      if (seatForUser !== socket.id) {
        const seatIndex = table.state.seats.indexOf(seatForUser);
        if (seatIndex !== -1) {
          table.state.seats[seatIndex] = socket.id;
        }
        const playerState = table.state.players[seatForUser];
        if (playerState) {
          delete table.state.players[seatForUser];
          playerState.id = socket.id;
          playerState.seatId = socket.id;
          table.state.players[socket.id] = playerState;
        }
      }
      const pendingTimer = table.pendingDisconnects.get(user.id);
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        table.pendingDisconnects.delete(user.id);
      }
      socket.join(tableId);
      this.socketTable.set(socket.id, tableId);
      this.socketUsers.set(socket.id, user.id);
      this.emitState(tableId);
      const snapshot = this.emitGameSnapshot(table);
      const hydratePayload = TablePlayStateResponse.parse({
        snapshot,
        hand: (table.state.players[socket.id]?.hand ?? []).map(card => ({ ...card }))
      });
      socket.emit('game:hydrate', hydratePayload);
      return;
    }

    if (seatForUser) {
      socket.emit('errorMessage', { message: 'User already seated at the table' });
      return;
    }

    if (table.state.seats.length >= table.config.capacity) {
      socket.emit('errorMessage', { message: 'Table is full' });
      return;
    }

    joinTable(table.state, socket.id, user.nickname, user.id);
    socket.join(tableId);
    this.socketTable.set(socket.id, tableId);
    this.socketUsers.set(socket.id, user.id);
    table.prepared.set(user.id, false);
    this.updateLobbyFromState(tableId);
    this.emitState(tableId);
    this.emitGameSnapshot(table);
  }

  handleStart(socket: AppServerSocket, payload: { tableId?: string }) {
    const tableId = normalizeTableId(payload.tableId ?? '');
    const managed = this.ensureHostAction(socket, tableId);
    if (!managed) return;
    if (managed.hasStarted) {
      socket.emit('errorMessage', { message: '牌局已经开始' });
      return;
    }
    if (managed.state.seats.length !== managed.config.capacity) {
      socket.emit('errorMessage', { message: '房间未满，无法开始' });
      return;
    }
    if (!this.allPlayersPrepared(managed)) {
      socket.emit('errorMessage', { message: '仍有玩家未准备' });
      return;
    }
    this.startVariantGame(managed);
  }

  handleKick(socket: AppServerSocket, payload: { tableId?: string; userId?: number }) {
    const tableId = normalizeTableId(payload.tableId ?? '');
    const managed = this.ensureHostAction(socket, tableId);
    if (!managed) return;
    if (payload.userId == null) return;
    if (payload.userId === managed.host.userId) {
      socket.emit('errorMessage', { message: 'Host cannot be removed' });
      return;
    }
    const targetSeatId = managed.state.seats.find(id => managed.state.players[id]?.userId === payload.userId);
    if (!targetSeatId) {
      socket.emit('errorMessage', { message: 'Player not found at the table' });
      return;
    }
    managed.state.seats = managed.state.seats.filter(id => id !== targetSeatId);
    delete managed.state.players[targetSeatId];
    this.socketTable.delete(targetSeatId);
    this.socketUsers.delete(targetSeatId);
    managed.prepared.delete(payload.userId);
    const targetSocket = this.io.sockets.sockets.get(targetSeatId);
    targetSocket?.emit('kicked', { tableId });
    targetSocket?.disconnect(true);
    this.resetTablePhaseIfNeeded(managed);
    this.updateLobbyFromState(tableId);
    this.emitState(tableId);
    this.emitGameSnapshot(managed);
  }

  handleUpdateConfig(socket: AppServerSocket, payload: { tableId?: string; capacity: number; requestId?: string }) {
    const tableId = normalizeTableId(payload.tableId ?? '');
    const requestId = this.resolveRequestId(payload.requestId);
    const managed = this.ensureHostAction(socket, tableId);
    if (!managed) return;
    if (managed.variant.capacity.locked) {
      socket.emit('errorMessage', { message: '当前玩法固定人数，无法调整' });
      return;
    }
    const minCapacity = managed.variant.capacity.min;
    const maxCapacity = managed.variant.capacity.max;
    const requestedCapacity = Math.min(Math.max(payload.capacity, minCapacity), maxCapacity);
    const currentPlayers = managed.state.seats.length;
    if (requestedCapacity < currentPlayers) {
      socket.emit('errorMessage', { message: '人数已超过该上限' });
      return;
    }
    managed.config.capacity = requestedCapacity;
    managed.config.variant = getVariantSummary(managed.variant.id);
    const hostUserId = this.socketUsers.get(socket.id);
    this.logStructured('table:updateConfig', {
      requestId,
      tableId,
      hostUserId,
      variantId: managed.variant.id,
      requestedCapacity: payload.capacity,
      appliedCapacity: requestedCapacity
    });
    this.resetTablePhaseIfNeeded(managed);
    this.updateLobbyFromState(tableId);
    this.emitState(tableId);
    this.emitGameSnapshot(managed);
  }

  handleSetPrepared(socket: AppServerSocket, payload: { tableId?: string; prepared: boolean; requestId?: string }) {
    const tableId = normalizeTableId(payload.tableId ?? '');
    const requestId = this.resolveRequestId(payload.requestId);
    const managed = this.tables.get(tableId);
    if (!managed) {
      socket.emit('errorMessage', { message: 'Unknown table' });
      return;
    }
    if (managed.hasStarted) {
      socket.emit('errorMessage', { message: '牌局已开始，无法切换准备状态' });
      return;
    }
    const userId = this.socketUsers.get(socket.id);
    if (!userId) {
      socket.emit('errorMessage', { message: 'Unknown user' });
      return;
    }
    const seated = managed.state.seats.some(id => managed.state.players[id]?.userId === userId);
    if (!seated) {
      socket.emit('errorMessage', { message: 'Player not seated at this table' });
      return;
    }
    managed.prepared.set(userId, payload.prepared);
    this.logStructured('table:setPrepared', {
      requestId,
      tableId,
      userId,
      prepared: payload.prepared
    });
    this.emitState(tableId);
    this.emitGameSnapshot(managed);
  }

  handleLeave(
    socket: AppServerSocket,
    payload: { tableId?: string; userId?: number },
    ack?: (result: { ok: boolean }) => void
  ) {
    const tableId = normalizeTableId(payload?.tableId ?? '');
    if (!tableId) return;
    const managed = this.tables.get(tableId);
    if (!managed) return;
    const userId = payload?.userId ?? this.socketUsers.get(socket.id);
    if (!userId) return;
    const seatId =
      managed.state.seats.find(id => managed.state.players[id]?.userId === userId) ?? socket.id;
    socket.leave(tableId);
    this.socketTable.delete(socket.id);
    this.socketUsers.delete(socket.id);
    if (managed.hasStarted) {
      this.endGameAndReset(managed, 'player-left');
    }
    this.removePlayerSeat(managed, seatId, userId);
    this.emitState(tableId);
    this.emitGameSnapshot(managed);
    if (ack) ack({ ok: true });
  }

  handleDisconnect(socketId: string) {
    this.cleanupPlayerSocket(socketId);
  }
}
