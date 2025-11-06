
import { describe, it, expect } from 'vitest';
import { makeDeck } from '../cards';
import { shuffle } from '../shuffle';
import { createTable, joinTable, deal, bet } from '../engine';

describe('deck + shuffle', () => {
  it('has 52 unique cards', () => {
    const deck = makeDeck();
    expect(deck).toHaveLength(52);
    const set = new Set(deck.map(c => c.suit + c.rank));
    expect(set.size).toBe(52);
  });

  it('deterministic shuffle by seed', () => {
    const d1 = shuffle(makeDeck(), 'seed123');
    const d2 = shuffle(makeDeck(), 'seed123');
    const d3 = shuffle(makeDeck(), 'seedXYZ');
    expect(d1).toEqual(d2);
    expect(d1).not.toEqual(d3);
  });
});

describe('table flow', () => {
  it('join, deal, bet', () => {
    const t = createTable('t1', 'seed123');
    joinTable(t, 'p1', 'Alice', 100);
    joinTable(t, 'p2', 'Bob', 100);
    deal(t, 2);
    expect(t.players['p1'].hand).toHaveLength(2);
    expect(t.players['p2'].hand).toHaveLength(2);
    bet(t, 'p1', 10);
    expect(t.pot).toBe(10);
    expect(t.players['p1'].chips).toBe(90);
  });
});
