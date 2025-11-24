import type { GameResult, GameVariantSummary } from '@shared/messages';
import type { GameVariantDefinition } from '@shared/variants';
import type { TablePhase } from '@shared/tablePhases';
import type { createTable } from '@game-core/engine';

export type BidValue = 0 | 1 | 2 | 3;

export type DouDizhuBiddingState = {
  currentSeatId: string;
  startingSeatId: string;
  highestBid: BidValue;
  highestBidderSeatId: string | null;
  bidsTaken: number;
  consecutivePasses: number;
  finished: boolean;
  redealRequired?: boolean;
};

export type DouDizhuVariantState = {
  bottomCards: GameDealCardEvent['card'][];
  bidding: DouDizhuBiddingState | null;
  landlordSeatId?: string;
  callScore?: BidValue;
  doubling?: {
    order: string[];
    turnIndex: number;
    defenderDoubles: Record<string, boolean>;
    landlordRedoubled: boolean;
    finished: boolean;
  };
  play?: {
    currentSeatId: string;
    lastCombo: Combo | null;
    lastSeatId: string | null;
    passCount: number;
    finished?: boolean;
    trickCombos: Record<string, Combo>;
  };
};

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
  lastResult?: GameResult | null;
};

// These imports rely on shared types, so keep them at the bottom to avoid circular ordering pitfalls.
import type { GameDealCardEvent } from '@shared/messages';
import type { Combo } from '@game-core/doudizhu';
