import { clearHands, resetDeck } from '@game-core/engine';
import type { AppServer } from '@shared/events';
import type { GameResult } from '@shared/messages';
import type { ManagedTable } from './tableTypes';
import type { TableDealingCoordinator } from './tableDealing';
import type { PhaseAction } from './types';
import type { createLobbyRegistry } from '../infrastructure/lobbyRegistry';

type SeatManagerDeps = {
  io: AppServer;
  lobby: ReturnType<typeof createLobbyRegistry>;
  tables: Map<string, ManagedTable>;
  socketTable: Map<string, string>;
  socketUsers: Map<string, number>;
  dealing: TableDealingCoordinator;
  transitionPhase: (table: ManagedTable, action: PhaseAction) => void;
  emitState: (tableId: string) => void;
  emitGameSnapshot: (table: ManagedTable) => void;
  updateLobbyFromState: (tableId: string) => void;
};

type GameEndReason = 'player-left' | 'manual-reset' | 'completed';

const RECONNECT_GRACE_MS = 5_000;

export class TableSeatManager {
  private readonly io: AppServer;
  private readonly lobby: SeatManagerDeps['lobby'];
  private readonly tables: SeatManagerDeps['tables'];
  private readonly socketTable: SeatManagerDeps['socketTable'];
  private readonly socketUsers: SeatManagerDeps['socketUsers'];
  private readonly dealing: TableDealingCoordinator;
  private readonly transitionPhase: SeatManagerDeps['transitionPhase'];
  private readonly emitState: SeatManagerDeps['emitState'];
  private readonly emitGameSnapshot: SeatManagerDeps['emitGameSnapshot'];
  private readonly updateLobbyFromState: SeatManagerDeps['updateLobbyFromState'];

  constructor(deps: SeatManagerDeps) {
    this.io = deps.io;
    this.lobby = deps.lobby;
    this.tables = deps.tables;
    this.socketTable = deps.socketTable;
    this.socketUsers = deps.socketUsers;
    this.dealing = deps.dealing;
    this.transitionPhase = deps.transitionPhase;
    this.emitState = deps.emitState;
    this.emitGameSnapshot = deps.emitGameSnapshot;
    this.updateLobbyFromState = deps.updateLobbyFromState;
  }

  setAllPrepared(table: ManagedTable, prepared: boolean) {
    for (const seatId of table.state.seats) {
      const player = table.state.players[seatId];
      if (player) {
        table.prepared.set(player.userId, prepared);
      }
    }
  }

  allPlayersPrepared(table: ManagedTable) {
    for (const seatId of table.state.seats) {
      const player = table.state.players[seatId];
      if (!player) continue;
      if (!table.prepared.get(player.userId)) {
        return false;
      }
    }
    return table.state.seats.length > 0;
  }

  resetTablePhaseIfNeeded(table: ManagedTable) {
    const wasStarted = table.hasStarted;
    if (table.state.seats.length < table.config.capacity) {
      this.endGameAndReset(table, wasStarted ? 'player-left' : undefined);
    }
  }

  endGameAndReset(table: ManagedTable, reason: GameEndReason | undefined, result?: GameResult) {
    console.info('[seatManager] endGameAndReset', {
      tableId: table.id,
      reason,
      hasStarted: table.hasStarted,
      result: result ? { winner: result.winner, finishedAt: result.finishedAt } : null
    });
    table.hasStarted = false;
    this.transitionPhase(table, { type: 'reset' });
    this.dealing.stop(table);
    clearHands(table.state);
    resetDeck(table.state, { packs: table.variant.deck.packs });
    this.setAllPrepared(table, false);
    table.variantState = {};
    this.updateLobbyFromState(table.id);
    this.emitState(table.id);
    this.emitGameSnapshot(table);
    if (reason) {
      this.io.to(table.id).emit('game:ended', { tableId: table.id, reason, result });
    }
  }

  promoteNewHostIfNeeded(table: ManagedTable, departingUserId?: number) {
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

  removePlayerSeat(table: ManagedTable, seatId: string, departingUserId?: number) {
    console.info('[seatManager] removePlayerSeat', {
      tableId: table.id,
      seatId,
      departingUserId,
      hasStarted: table.hasStarted,
      lastResult: Boolean(table.lastResult)
    });
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
      this.dealing.stop(table);
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

  cleanupPlayerSocket(socketId: string) {
    const tableId = this.socketTable.get(socketId);
    const userId = this.socketUsers.get(socketId);
    console.info('[seatManager] cleanupPlayerSocket', {
      socketId,
      tableId,
      userId,
      hasMapping: Boolean(tableId)
    });
    this.socketTable.delete(socketId);
    this.socketUsers.delete(socketId);
    if (!tableId) {
      return;
    }
    const managed = this.tables.get(tableId);
    if (!managed) {
      return;
    }
    if (managed.lastResult && !managed.hasStarted) {
      // Keep seats intact after a completed round so the prepare room stays populated.
      console.info('[seatManager] skip removal post-result', { tableId, socketId });
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
}
