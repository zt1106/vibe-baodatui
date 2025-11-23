import { describe, expect, it } from 'vitest';

import {
  derivePhaseStatus,
  initialTablePhase,
  tablePhaseReducer,
  type TablePhase
} from '../tablePhases';

describe('tablePhaseReducer', () => {
  it('transitions through dealing and complete phases', () => {
    const dealing = tablePhaseReducer(initialTablePhase, {
      type: 'start-dealing',
      traceId: 'trace-1'
    });
    expect(derivePhaseStatus(dealing)).toBe('dealing');
    expect(dealing).toMatchObject({ traceId: 'trace-1' });

    const complete = tablePhaseReducer(dealing, { type: 'complete', reason: 'deck-depleted' });
    expect(derivePhaseStatus(complete)).toBe('complete');
    expect(complete).toMatchObject({ traceId: 'trace-1', reason: 'deck-depleted' });
  });

  it('resets back to idle from any state', () => {
    const current: TablePhase = { status: 'complete', reason: 'stopped' };
    const reset = tablePhaseReducer(current, { type: 'reset' });
    expect(reset).toEqual(initialTablePhase);
  });
});
