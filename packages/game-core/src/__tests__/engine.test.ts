
import { describe, it, expect } from 'vitest';
import { makeDeck } from '../cards';
import { shuffle } from '../shuffle';
import { createTable, joinTable, deal, resetDeck, clearHands, drawCard, reduceTable } from '../engine';

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
  it('joins seats idempotently and keeps ordering', () => {
    const t = createTable('t1', 'seed123');
    const first = reduceTable(t, { type: 'seat/join', seatId: 'p1', nickname: 'Alice', userId: 1 });
    expect(first.ok).toBe(true);
    expect(first.result).toMatchObject({ type: 'seat/joined', created: true });
    const second = reduceTable(t, { type: 'seat/join', seatId: 'p1', nickname: 'Alice', userId: 1 });
    expect(second.ok).toBe(true);
    expect(second.result).toMatchObject({ type: 'seat/joined', created: false });
    const third = reduceTable(t, { type: 'seat/join', seatId: 'p2', nickname: 'Bob', userId: 2 });
    expect(third.result).toMatchObject({ type: 'seat/joined', created: true });
    expect(t.seats).toEqual(['p1', 'p2']);
  });

  it('resets deck with new seed and pack count', () => {
    const t = createTable('t2', 'seed-1');
    const next = reduceTable(t, { type: 'deck/reset', options: { seed: 'seed-2', packs: 1 } });
    expect(next.ok && next.result.type === 'deck/reset' ? next.result.deckCount : 0).toBe(54);
    expect(t.seed).toBe('seed-2');
    const expected = shuffle(makeDeck({ packs: 1 }), 'seed-2');
    expect(t.deck).toEqual(expected);
  });

  it('deals cards with structured hands', () => {
    const t = createTable('t3', 'seed-3');
    joinTable(t, 'p1', 'Alice', 1);
    joinTable(t, 'p2', 'Bob', 2);
    const outcome = reduceTable(t, { type: 'deal/apply', countPerPlayer: 2 });
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.result.type === 'deal/dealt') {
      expect(outcome.result.totalDealt).toBe(4);
      expect(outcome.result.hands['p1']).toHaveLength(2);
      expect(outcome.result.hands['p2']).toHaveLength(2);
    }
    expect(t.players['p1'].hand).toHaveLength(2);
    expect(t.players['p2'].hand).toHaveLength(2);
  });

  it('clears hands and handles invalid draws without consuming the deck', () => {
    const t = createTable('t3', 'seed-3');
    joinTable(t, 'p1', 'Alice', 1);
    reduceTable(t, { type: 'deal/apply', countPerPlayer: 1 });
    expect(t.players['p1'].hand.length).toBe(1);
    clearHands(t);
    expect(t.players['p1'].hand.length).toBe(0);

    t.deck = [];
    const emptyDeck = reduceTable(t, { type: 'deck/draw', seatId: 'p1' });
    expect(emptyDeck.ok).toBe(false);
    expect(emptyDeck.ok ? null : emptyDeck.error.type).toBe('deck/empty');
    t.deck = makeDeck();
    const missingSeat = reduceTable(t, { type: 'deck/draw', seatId: 'missing' });
    expect(missingSeat.ok).toBe(false);
    expect(missingSeat.ok ? null : missingSeat.error.type).toBe('seat/missing');
    expect(t.deck).toHaveLength(makeDeck().length);
    expect(drawCard(t, 'missing')).toBeNull();
  });

  it('throws when dealing more cards than available', () => {
    const t = createTable('t4', 'seed-4');
    joinTable(t, 'p1', 'Alice', 1);
    joinTable(t, 'p2', 'Bob', 2);
    t.deck = [{ id: 1, rank: 'A', suit: 'S', faceUp: false }];
    expect(() => deal(t, 1)).toThrow('Deck exhausted');
    const failing = reduceTable(t, { type: 'deal/apply', countPerPlayer: 1 });
    expect(failing.ok).toBe(false);
    expect(failing.ok ? null : failing.error.type).toBe('deal/deck-exhausted');
    expect(t.deck).toHaveLength(1);
  });
});
