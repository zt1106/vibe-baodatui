export const TABLE_PHASE_STATUSES = ['idle', 'dealing', 'bidding', 'doubling', 'playing', 'complete'] as const;
export type TablePhaseStatus = (typeof TABLE_PHASE_STATUSES)[number];

export type TablePhaseCompleteReason = 'deck-depleted' | 'bottom-cards' | 'stopped';

export type TablePhase =
  | { status: 'idle' }
  | { status: 'dealing'; traceId?: string }
  | { status: 'bidding'; traceId?: string; reason?: string }
  | { status: 'doubling'; traceId?: string; reason?: string }
  | { status: 'playing'; traceId?: string; reason?: string }
  | { status: 'complete'; traceId?: string; reason?: TablePhaseCompleteReason };

export type TablePhaseAction =
  | { type: 'reset' }
  | { type: 'start-dealing'; traceId?: string }
  | { type: 'start-bidding'; traceId?: string; reason?: string }
  | { type: 'start-doubling'; traceId?: string; reason?: string }
  | { type: 'start-playing'; traceId?: string; reason?: string }
  | { type: 'complete'; traceId?: string; reason?: TablePhaseCompleteReason };

export const initialTablePhase: TablePhase = { status: 'idle' };

export function tablePhaseReducer(state: TablePhase, action: TablePhaseAction): TablePhase {
  switch (action.type) {
    case 'reset': {
      return initialTablePhase;
    }
    case 'start-dealing': {
      const traceId = 'traceId' in state ? state.traceId : undefined;
      return { status: 'dealing', traceId: action.traceId ?? traceId };
    }
    case 'start-bidding': {
      const traceId = 'traceId' in state ? state.traceId : undefined;
      return {
        status: 'bidding',
        traceId: action.traceId ?? traceId,
        reason: action.reason
      };
    }
    case 'start-doubling': {
      const traceId = 'traceId' in state ? state.traceId : undefined;
      return {
        status: 'doubling',
        traceId: action.traceId ?? traceId,
        reason: action.reason
      };
    }
    case 'start-playing': {
      const traceId = 'traceId' in state ? state.traceId : undefined;
      return {
        status: 'playing',
        traceId: action.traceId ?? traceId,
        reason: action.reason
      };
    }
    case 'complete': {
      if (state.status === 'idle') {
        return { status: 'complete', traceId: action.traceId, reason: action.reason };
      }
      const traceId = 'traceId' in state ? state.traceId : undefined;
      return {
        status: 'complete',
        traceId: action.traceId ?? traceId,
        reason: action.reason
      };
    }
    default: {
      // Exhaustive guard for future action types.
      return state;
    }
  }
}

export function derivePhaseStatus(phase: TablePhase): TablePhaseStatus {
  return phase.status;
}

type PhaseWithReason = Extract<TablePhase, { reason?: unknown }>;
type PhaseWithTraceId = Extract<TablePhase, { traceId?: string }>;
type PhaseActionWithTraceId = Extract<TablePhaseAction, { traceId?: string }>;

export function getPhaseReason(phase: TablePhase): PhaseWithReason['reason'] | undefined {
  return 'reason' in phase ? phase.reason : undefined;
}

export function getPhaseTraceId(phase: TablePhase): PhaseWithTraceId['traceId'] | undefined {
  return 'traceId' in phase ? phase.traceId : undefined;
}

export function getActionTraceId(action: TablePhaseAction): PhaseActionWithTraceId['traceId'] | undefined {
  return 'traceId' in action ? action.traceId : undefined;
}
