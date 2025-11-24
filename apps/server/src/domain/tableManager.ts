import { randomUUID } from 'crypto';
import type {
  GameSnapshot,
  GameVariantId,
  GameResult,
  ServerState } from '@shared/messages';
import {
  deriveLobbyRoomStatus,
  TablePlayStateResponse,
  TablePrepareResponse
} from '@shared/messages';
import type { AppServer, AppServerSocket } from '@shared/events';
import { createTable, joinTable, resetDeck } from '@game-core/engine';
import { DEFAULT_AVATAR, type AvatarFilename } from '@shared/avatars';
import { GAME_VARIANTS_BY_ID, getVariantDefinition, getVariantSummary } from '@shared/variants';
import {
  derivePhaseStatus,
  getActionTraceId,
  getPhaseReason,
  getPhaseTraceId,
  initialTablePhase,
  tablePhaseReducer
} from '@shared/tablePhases';
import type { createLobbyRegistry } from '../infrastructure/lobbyRegistry';
import type { createUserRegistry } from '../infrastructure/userRegistry';
import { DuplicateNicknameError, UserNotFoundError } from '../infrastructure/userRegistry';
import { ClassicController } from './variants/classicController';
import { DouDizhuController } from './variants/douDizhuController';
import { TableDealingCoordinator, type TableDealingDeps } from './tableDealing';
import { TableSeatManager } from './tableSeatManager';
import type { VariantController, VariantSnapshot } from './variantController';
import type { ManagedTable } from './tableTypes';
import type { PhaseAction } from './types';
import { logError, logInfo } from '../logger';

export { setDealDelayMs } from './tableDealing';
export type { ManagedTable } from './tableTypes';

export type TableManagerDeps = {
  io: AppServer;
  lobby: ReturnType<typeof createLobbyRegistry>;
  users: ReturnType<typeof createUserRegistry>;
  createDealingCoordinator?: (deps: TableDealingDeps) => TableDealingCoordinator;
};

export const normalizeTableId = (id: string) => id.trim();

export class TableManager {
  private readonly io: AppServer;
  private readonly lobby: ReturnType<typeof createLobbyRegistry>;
  private readonly users: ReturnType<typeof createUserRegistry>;
  private readonly tables = new Map<string, ManagedTable>();
  private readonly socketTable = new Map<string, string>();
  private readonly socketUsers = new Map<string, number>();
  private readonly USER_AVATAR_FALLBACK: AvatarFilename = DEFAULT_AVATAR;
  private readonly snapshotListeners = new Set<(table: ManagedTable, snapshot: GameSnapshot) => void>();
  private readonly dealing: TableDealingCoordinator;
  private readonly seatManager: TableSeatManager;
  private readonly defaultVariantController: VariantController;
  private readonly douDizhuController: DouDizhuController;
  private readonly variantControllers: Partial<Record<GameVariantId, VariantController>>;

  constructor(deps: TableManagerDeps) {
    this.io = deps.io;
    this.lobby = deps.lobby;
    this.users = deps.users;

    const createDealingCoordinator =
      deps.createDealingCoordinator ?? ((dealingDeps: TableDealingDeps) => new TableDealingCoordinator(dealingDeps));

    this.dealing = createDealingCoordinator({
      io: this.io,
      resolveRequestId: this.resolveRequestId.bind(this),
      transitionPhase: (table, action) => this.transitionPhase(table, action),
      emitState: tableId => this.emitState(tableId),
      emitGameSnapshot: (table, lastDealtSeatId) => this.emitGameSnapshot(table, lastDealtSeatId),
      logStructured: (event, context) => this.logStructured(event, context)
    });

    this.seatManager = new TableSeatManager({
      io: this.io,
      lobby: this.lobby,
      tables: this.tables,
      socketTable: this.socketTable,
      socketUsers: this.socketUsers,
      dealing: this.dealing,
      transitionPhase: (table, action) => this.transitionPhase(table, action),
      emitState: tableId => this.emitState(tableId),
      emitGameSnapshot: table => this.emitGameSnapshot(table),
      updateLobbyFromState: tableId => this.updateLobbyFromState(tableId)
    });

    this.defaultVariantController = new ClassicController({
      dealing: this.dealing,
      emitState: tableId => this.emitState(tableId),
      emitGameSnapshot: table => this.emitGameSnapshot(table),
      transitionPhase: (table, action) => this.transitionPhase(table, action),
      updateLobbyFromState: tableId => this.updateLobbyFromState(tableId),
      setAllPrepared: (table, prepared) => this.seatManager.setAllPrepared(table, prepared)
    });

    this.douDizhuController = new DouDizhuController({
      dealing: this.dealing,
      emitState: tableId => this.emitState(tableId),
      emitGameSnapshot: (table, lastDealtSeatId) => this.emitGameSnapshot(table, lastDealtSeatId),
      transitionPhase: (table, action) => this.transitionPhase(table, action),
      updateLobbyFromState: tableId => this.updateLobbyFromState(tableId),
      setAllPrepared: (table, prepared) => this.seatManager.setAllPrepared(table, prepared),
      nextSeatId: (table, seatId) => this.nextSeatId(table, seatId),
      completeGame: (table, result) => this.completeGame(table, result),
      logStructured: (event, context) => this.logStructured(event, context)
    });

    this.variantControllers = {
      'dou-dizhu': this.douDizhuController
    };
  }

  private getVariantController(table: ManagedTable) {
    return this.variantControllers[table.variant.id] ?? this.defaultVariantController;
  }

  private transitionPhase(table: ManagedTable, action: PhaseAction) {
    const previous = table.phase;
    table.phase = tablePhaseReducer(table.phase, action);
    const previousReason = getPhaseReason(previous);
    const nextReason = getPhaseReason(table.phase);
    if (previous.status !== table.phase.status || previousReason !== nextReason) {
      this.logStructured('phase:change', {
        tableId: table.id,
        from: previous.status,
        to: table.phase.status,
        reason: nextReason,
        traceId: getPhaseTraceId(table.phase) ?? getActionTraceId(action)
      });
    }
    return table.phase;
  }

  private resolveRequestId(requestId?: string) {
    if (typeof requestId === 'string' && requestId.trim()) {
      return requestId.trim();
    }
    return randomUUID();
  }

  private logStructured(event: string, context: Record<string, unknown>) {
    logInfo(event, { scope: 'table', ...context });
  }

  getActiveTableIds() {
    return Array.from(this.tables.keys());
  }

  getSnapshot(tableId: string) {
    const table = this.getManagedTable(tableId);
    if (!table) return null;
    return this.buildGameSnapshot(table);
  }

  private resolveUserAvatar(userId: number): AvatarFilename {
    const record = this.users.findById(userId);
    return record?.avatar ?? this.USER_AVATAR_FALLBACK;
  }

  onSnapshot(listener: (table: ManagedTable, snapshot: GameSnapshot) => void) {
    this.snapshotListeners.add(listener);
    return () => this.snapshotListeners.delete(listener);
  }

  getManagedTable(tableId: string) {
    const normalized = normalizeTableId(tableId);
    if (!normalized) return null;
    return this.tables.get(normalized) ?? null;
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

  private nextSeatId(table: ManagedTable, seatId: string) {
    const seats = table.state.seats;
    if (seats.length === 0) return seatId;
    const currentIndex = seats.indexOf(seatId);
    if (currentIndex === -1) {
      return seats[0];
    }
    return seats[(currentIndex + 1) % seats.length];
  }

  private getVariantSnapshot(table: ManagedTable): VariantSnapshot {
    const controller = this.getVariantController(table);
    return controller.buildSnapshot ? controller.buildSnapshot(table) : { deckCount: table.state.deck.length };
  }

  private completeGame(table: ManagedTable, result?: GameResult) {
    logInfo('tableManager:completeGame', {
      tableId: table.id,
      result: result ? { winner: result.winner, finishedAt: result.finishedAt } : null
    });
    table.lastResult = result ?? null;
    this.seatManager.endGameAndReset(table, 'completed', result);
    this.updateLobbyFromState(table.id);
    this.emitState(table.id);
  }

  private resolveCurrentTurnSeatId(table: ManagedTable, lastDealtSeatId?: string) {
    const variantSeatId = this.getVariantController(table).resolveCurrentTurnSeatId?.(table, lastDealtSeatId);
    if (variantSeatId !== undefined) {
      return variantSeatId;
    }
    if (table.phase.status === 'dealing') {
      const seats = table.state.seats;
      if (seats.length === 0) return undefined;
      const seatIndex = table.dealingState?.seatIndex ?? 0;
      const normalized = seatIndex % seats.length;
      return seats[normalized];
    }
    if (table.phase.status === 'playing') {
      const hostSeat = table.state.seats.find(id => table.state.players[id]?.userId === table.host.userId);
      return hostSeat ?? table.state.seats[0];
    }
    return lastDealtSeatId;
  }

  private buildGameSnapshot(table: ManagedTable, lastDealtSeatId?: string): GameSnapshot {
    const variantSnapshot = this.getVariantSnapshot(table);
    const deckCount = variantSnapshot.deckCount ?? table.state.deck.length;
    const currentTurnSeatId =
      variantSnapshot.currentTurnSeatId ?? this.resolveCurrentTurnSeatId(table, lastDealtSeatId);
    const { deckCount: _deckCount, currentTurnSeatId: _turnSeatId, ...restVariant } = variantSnapshot;
    return {
      tableId: table.id,
      phase: derivePhaseStatus(table.phase),
      deckCount,
      lastDealtSeatId,
      currentTurnSeatId,
      variant: table.config.variant,
      ...restVariant,
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
    for (const listener of this.snapshotListeners) {
      try {
        listener(table, snapshot);
      } catch (error) {
        logError('table:snapshotListenerFailed', error, { tableId: table.id });
      }
    }
    return snapshot;
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
      },
      lastResult: table.lastResult ?? undefined
    });
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
      variantState: {},
      lastResult: null
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
        })),
      lastResult: table.lastResult ?? undefined
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
        logError('tableManager:handleJoinFailed', error, {
          tableId,
          socketId: socket.id,
          requestedUserId
        });
        socket.emit('errorMessage', { message: 'Failed to join table' });
      }
      return;
    }

    const seatForUser = table.state.seats.find(id => table.state.players[id]?.userId === user.id);

    const allowSeatSwap = table.hasStarted || table.lastResult;
    if (table.hasStarted) {
      if (!seatForUser) {
        socket.emit('errorMessage', { message: '牌局已开始，暂无法加入' });
        return;
      }
    }

    if (seatForUser && seatForUser !== socket.id && allowSeatSwap) {
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
    } else if (seatForUser) {
      socket.emit('errorMessage', { message: 'User already seated at the table' });
      return;
    }

    if (table.hasStarted) {
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

    const reconnecting = Boolean(seatForUser);
    if (!reconnecting && table.state.seats.length >= table.config.capacity) {
      socket.emit('errorMessage', { message: 'Table is full' });
      return;
    }

    if (!reconnecting) {
      joinTable(table.state, socket.id, user.nickname, user.id);
    }

    socket.join(tableId);
    this.socketTable.set(socket.id, tableId);
    this.socketUsers.set(socket.id, user.id);
    if (!reconnecting) {
      table.prepared.set(user.id, false);
    }
    this.updateLobbyFromState(tableId);
    this.emitState(tableId);
    this.emitGameSnapshot(table);
  }

  handleStart(socket: AppServerSocket, payload: { tableId?: string }) {
    const tableId = normalizeTableId(payload.tableId ?? '');
    const managed = this.ensureHostAction(socket, tableId);
    if (!managed) return;
    logInfo('tableManager:handleStart', { tableId, hasStarted: managed.hasStarted });
    if (managed.hasStarted) {
      socket.emit('errorMessage', { message: '牌局已经开始' });
      return;
    }
    if (managed.state.seats.length !== managed.config.capacity) {
      socket.emit('errorMessage', { message: '房间未满，无法开始' });
      return;
    }
    if (!this.seatManager.allPlayersPrepared(managed)) {
      socket.emit('errorMessage', { message: '仍有玩家未准备' });
      return;
    }
    managed.lastResult = null;
    this.getVariantController(managed).start(managed);
  }

  handleBid(socket: AppServerSocket, payload: { tableId: string; bid: number }, ack?: (result: { ok: boolean; message?: string }) => void) {
    const tableId = normalizeTableId(payload.tableId ?? '');
    const managed = this.tables.get(tableId);
    if (!managed) {
      ack?.({ ok: false, message: 'Unknown table' });
      return;
    }
    if (managed.variant.id !== 'dou-dizhu') {
      ack?.({ ok: false, message: '当前牌桌不支持叫分' });
      return;
    }
    logInfo('tableManager:handleBid', { tableId, seatId: socket.id, bid: payload.bid });
    this.douDizhuController.handleBid(managed, socket, { bid: payload.bid }, ack);
  }

  handleDouble(socket: AppServerSocket, payload: { tableId: string; double: boolean }, ack?: (result: { ok: boolean; message?: string }) => void) {
    const tableId = normalizeTableId(payload.tableId ?? '');
    const managed = this.tables.get(tableId);
    if (!managed) {
      ack?.({ ok: false, message: 'Unknown table' });
      return;
    }
    if (managed.variant.id !== 'dou-dizhu') {
      ack?.({ ok: false, message: '当前牌桌不支持加倍' });
      return;
    }
    logInfo('tableManager:handleDouble', { tableId, seatId: socket.id, double: payload.double });
    this.douDizhuController.handleDouble(managed, socket, { double: payload.double }, ack);
  }

  handlePlay(
    socket: AppServerSocket,
    payload: { tableId: string; cardIds: number[] },
    ack?: (result: { ok: boolean; message?: string }) => void
  ) {
    const tableId = normalizeTableId(payload.tableId ?? '');
    const managed = this.tables.get(tableId);
    if (!managed) {
      ack?.({ ok: false, message: 'Unknown table' });
      return;
    }
    if (managed.variant.id !== 'dou-dizhu') {
      ack?.({ ok: false, message: '当前牌桌不支持出牌' });
      return;
    }
    logInfo('tableManager:handlePlay', { tableId, seatId: socket.id, cardCount: payload.cardIds.length });
    this.douDizhuController.handlePlay(managed, socket, { cardIds: payload.cardIds }, ack);
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
    this.socketTable.delete(targetSeatId);
    this.socketUsers.delete(targetSeatId);
    this.seatManager.removePlayerSeat(managed, targetSeatId, payload.userId);
    const targetSocket = this.io.sockets.sockets.get(targetSeatId);
    targetSocket?.emit('kicked', { tableId });
    targetSocket?.disconnect(true);
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
    this.seatManager.resetTablePhaseIfNeeded(managed);
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
    logInfo('tableManager:handleLeave', { tableId, socketId: socket.id });
    const userId = payload?.userId ?? this.socketUsers.get(socket.id);
    if (!userId) return;
    const seatId =
      managed.state.seats.find(id => managed.state.players[id]?.userId === userId) ?? socket.id;
    socket.leave(tableId);
    this.socketTable.delete(socket.id);
    this.socketUsers.delete(socket.id);
    if (managed.hasStarted) {
      this.seatManager.endGameAndReset(managed, 'player-left');
    }
    this.seatManager.removePlayerSeat(managed, seatId, userId);
    this.emitState(tableId);
    this.emitGameSnapshot(managed);
    if (ack) ack({ ok: true });
  }

  handleDisconnect(socketId: string) {
    this.seatManager.cleanupPlayerSocket(socketId);
  }
}
