
import { describe, it, expect } from 'vitest';
import { makeDeck } from '../cards';
import { shuffle } from '../shuffle';
import { createTable, joinTable, deal, resetDeck, clearHands, drawCard } from '../engine';

describe('deck + shuffle', () => {
  it('builds two packs (108 cards with jokers)', () => {
    const deck = makeDeck();
    expect(deck).toHaveLength(108);
    const ids = new Set(deck.map(card => card.id));
    expect(ids.size).toBe(108);
    const jokers = deck.filter(card => card.rank === 'Joker');
    expect(jokers).toHaveLength(4);
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
  it('join and deal cards to each player', () => {
    const t = createTable('t1', 'seed123');
    joinTable(t, 'p1', 'Alice', 1);
    joinTable(t, 'p2', 'Bob', 2);
    deal(t, 2);
    expect(t.players['p1'].userId).toBe(1);
    expect(t.players['p1'].hand).toHaveLength(2);
    expect(t.players['p2'].hand).toHaveLength(2);
    expect(t.seats).toEqual(['p1', 'p2']);
  });

  it('resets deck with new seed and pack count', () => {
    const t = createTable('t2', 'seed-1');
    const next = resetDeck(t, { seed: 'seed-2', packs: 1 });
    expect(next.seed).toBe('seed-2');
    expect(next.deck).toHaveLength(54);
    const expected = shuffle(makeDeck({ packs: 1 }), 'seed-2');
    expect(next.deck).toEqual(expected);
  });

  it('clears hands and handles invalid draws', () => {
    const t = createTable('t3', 'seed-3');
    joinTable(t, 'p1', 'Alice', 1);
    deal(t, 1);
    expect(t.players['p1'].hand.length).toBe(1);
    clearHands(t);
    expect(t.players['p1'].hand.length).toBe(0);

    t.deck = [];
    expect(drawCard(t, 'p1')).toBeNull();
    t.deck = makeDeck();
    expect(drawCard(t, 'missing')).toBeNull();
  });

  it('throws when dealing more cards than available', () => {
    const t = createTable('t4', 'seed-4');
    joinTable(t, 'p1', 'Alice', 1);
    joinTable(t, 'p2', 'Bob', 2);
    t.deck = [{ id: 1, rank: 'A', suit: 'S', faceUp: false }];
    expect(() => deal(t, 1)).toThrow('Deck exhausted');
  });
});
