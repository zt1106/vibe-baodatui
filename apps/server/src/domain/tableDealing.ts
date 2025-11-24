import { drawCard } from '@game-core/engine';
import type { AppServer } from '@shared/events';
import type { GameDealCardEvent } from '@shared/messages';
import type { ManagedTable } from './tableTypes';
import type { PhaseAction } from './types';

type DealConfig = {
  mode: 'classic' | 'dou-dizhu';
  stopWhen: (table: ManagedTable) => boolean;
  onFinish: (table: ManagedTable) => void;
};

type DealingDeps = {
  io: AppServer;
  resolveRequestId: (requestId?: string) => string;
  transitionPhase: (table: ManagedTable, action: PhaseAction) => void;
  emitState: (tableId: string) => void;
  emitGameSnapshot: (table: ManagedTable, lastDealtSeatId?: string) => void;
  logStructured: (event: string, context: Record<string, unknown>) => void;
};

let DEAL_DELAY_MS = 600;

export type TableDealConfig = DealConfig;
export type TableDealingDeps = DealingDeps;

export function setDealDelayMs(delay: number) {
  DEAL_DELAY_MS = Math.max(0, delay);
}

export class TableDealingCoordinator {
  private readonly io: AppServer;
  private readonly resolveRequestId: (requestId?: string) => string;
  private readonly transitionPhase: (table: ManagedTable, action: PhaseAction) => void;
  private readonly emitState: (tableId: string) => void;
  private readonly emitGameSnapshot: (table: ManagedTable, lastDealtSeatId?: string) => void;
  private readonly logStructured: (event: string, context: Record<string, unknown>) => void;

  constructor(deps: DealingDeps) {
    this.io = deps.io;
    this.resolveRequestId = deps.resolveRequestId;
    this.transitionPhase = deps.transitionPhase;
    this.emitState = deps.emitState;
    this.emitGameSnapshot = deps.emitGameSnapshot;
    this.logStructured = deps.logStructured;
  }

  stop(table: ManagedTable) {
    const timer = table.dealingState?.timer;
    if (timer) {
      clearTimeout(timer);
    }
    table.dealingState = null;
  }

  start(table: ManagedTable, config: DealConfig) {
    if (table.state.seats.length === 0) {
      return;
    }
    this.stop(table);
    const traceId = this.resolveRequestId();
    this.transitionPhase(table, { type: 'start-dealing', traceId });
    table.dealingState = { timer: null, seatIndex: 0, traceId };
    this.logStructured('deal:start', {
      traceId,
      tableId: table.id,
      hostUserId: table.host.userId,
      variant: table.variant.id,
      mode: config.mode,
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
        this.stop(table);
        this.emitGameSnapshot(table);
        return;
      }
      if (config.stopWhen(table)) {
        config.onFinish(table);
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
}
