export const TABLE_PHASE_STATUSES = ['idle', 'dealing', 'complete'] as const;
export type TablePhaseStatus = (typeof TABLE_PHASE_STATUSES)[number];

export type TablePhaseCompleteReason = 'deck-depleted' | 'bottom-cards' | 'stopped';

export type TablePhase =
  | { status: 'idle' }
  | { status: 'dealing'; traceId?: string }
  | { status: 'complete'; traceId?: string; reason?: TablePhaseCompleteReason };

export type TablePhaseAction =
  | { type: 'reset' }
  | { type: 'start-dealing'; traceId?: string }
  | { type: 'complete'; traceId?: string; reason?: TablePhaseCompleteReason };

export const initialTablePhase: TablePhase = { status: 'idle' };

export function tablePhaseReducer(state: TablePhase, action: TablePhaseAction): TablePhase {
  switch (action.type) {
    case 'reset': {
      return initialTablePhase;
    }
    case 'start-dealing': {
      return { status: 'dealing', traceId: action.traceId ?? state.traceId };
    }
    case 'complete': {
      if (state.status === 'idle') {
        return { status: 'complete', traceId: action.traceId, reason: action.reason };
      }
      return {
        status: 'complete',
        traceId: action.traceId ?? state.traceId,
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
