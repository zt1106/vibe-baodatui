import { describe, expect, it } from 'vitest';

import { makeCard } from '@core-cards/ids';
import { ComboType, createPlayValidator } from '../doudizhu';

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
});
