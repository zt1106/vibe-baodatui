import { describe, expect, it } from 'vitest';

import { makeCard } from '@core-cards/ids';
import { advanceTrick, ComboType, createPlayValidator, nextSeat, classifyCombo } from '../doudizhu';

const c = (rank: Parameters<typeof makeCard>[0], suit: Parameters<typeof makeCard>[1]) => makeCard(rank, suit);

describe('play validator', () => {
  const validator = createPlayValidator();

  it('matches combos in order for leading plays', () => {
    const lead = validator.validateLead([c('3', 'S'), c('3', 'H')]);
    expect(lead.ok).toBe(true);
    expect(lead.combo?.type).toBe(ComboType.PAIR);

    const invalid = validator.validateLead([c('3', 'S'), c('4', 'H')]);
    expect(invalid.ok).toBe(false);
  });

  it('validates following play beats previous', () => {
    const prev = validator.validateLead([c('5', 'S')]).combo!;
    const followOk = validator.validateFollow([c('6', 'H')], prev);
    expect(followOk.ok).toBe(true);
    expect(followOk.combo?.type).toBe(ComboType.SINGLE);

    const followFail = validator.validateFollow([c('4', 'H')], prev);
    expect(followFail.ok).toBe(false);
    expect(followFail.reason).toBe('does-not-beat');
  });

  it('advances tricks with two-pass reset and blocks leading pass', () => {
    const prev = classifyCombo([c('7', 'S')])!;
    const trickState = { lastCombo: prev, lastSeatId: 0 as const, passCountSinceLastPlay: 0 };

    const firstPass = advanceTrick({
      combo: { type: ComboType.PASS, cards: [] },
      seatId: 1 as const,
      state: trickState,
      getNextSeat: nextSeat
    });
    expect(firstPass.ok).toBe(true);
    if (firstPass.ok) {
      expect(firstPass.state.passCountSinceLastPlay).toBe(1);
      expect(firstPass.nextSeatId).toBe(2);
    }

    const secondPass = advanceTrick({
      combo: { type: ComboType.PASS, cards: [] },
      seatId: 2 as const,
      state: firstPass.ok ? firstPass.state : trickState,
      getNextSeat: nextSeat
    });
    expect(secondPass.ok).toBe(true);
    if (secondPass.ok) {
      expect(secondPass.trickEnded).toBe(true);
      expect(secondPass.nextSeatId).toBe(0);
      expect(secondPass.state.lastCombo).toBeNull();
      expect(secondPass.state.passCountSinceLastPlay).toBe(0);
    }

    const leadingPass = advanceTrick({
      combo: { type: ComboType.PASS, cards: [] },
      seatId: 0 as const,
      state: { lastCombo: null, lastSeatId: null, passCountSinceLastPlay: 0 },
      getNextSeat: nextSeat
    });
    expect(leadingPass.ok).toBe(false);
    if (!leadingPass.ok) {
      expect(leadingPass.reason).toBe('cannot-pass-when-leading');
    }
  });
});
