import { describe, expect, it } from 'vitest';
import { shuffleDeck } from '../shuffle';

const sample = ['a', 'b', 'c', 'd', 'e'];

describe('shuffleDeck', () => {
  it('returns deterministic order for same seed', () => {
    const first = shuffleDeck(sample, 'seed');
    const second = shuffleDeck(sample, 'seed');
    expect(first).toEqual(second);
  });

  it('produces different order for different seeds', () => {
    const first = shuffleDeck(sample, 'seed-one');
    const second = shuffleDeck(sample, 'seed-two');
    expect(first).not.toEqual(second);
  });

  it('does not mutate original array', () => {
    const clone = [...sample];
    shuffleDeck(clone, 1);
    expect(clone).toEqual(sample);
  });
});
