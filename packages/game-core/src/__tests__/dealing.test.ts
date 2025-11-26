import { describe, it, expect } from 'vitest';
import { createTable, joinTable, deal, reduceTable } from '../engine';

describe('card dealing', () => {
  it('deals correct number of cards per player with no duplicates', () => {
    const t = createTable('test-deal-1', 'seed-deal-1');
    joinTable(t, 'p1', 'Alice', 1);
    joinTable(t, 'p2', 'Bob', 2);
    joinTable(t, 'p3', 'Charlie', 3);

    const outcome = reduceTable(t, { type: 'deal/apply', countPerPlayer: 5 });
    expect(outcome.ok).toBe(true);

    if (outcome.ok && outcome.result.type === 'deal/dealt') {
      // Check total dealt count
      expect(outcome.result.totalDealt).toBe(15); // 3 players × 5 cards
      expect(outcome.result.cardsPerPlayer).toBe(5);
      expect(outcome.result.seats).toEqual(['p1', 'p2', 'p3']);

      // Verify each player has correct number of cards
      expect(t.players['p1'].hand).toHaveLength(5);
      expect(t.players['p2'].hand).toHaveLength(5);
      expect(t.players['p3'].hand).toHaveLength(5);

      // Check no duplicate cards across all hands
      const allDealtCards = [
        ...t.players['p1'].hand,
        ...t.players['p2'].hand,
        ...t.players['p3'].hand
      ];
      const cardIds = allDealtCards.map(card => card.id);
      const uniqueIds = new Set(cardIds);
      expect(uniqueIds.size).toBe(15); // All cards should be unique

      // Verify cards came from the deck (original deck - dealt cards)
      expect(t.deck).toHaveLength(54 - 15);
    }
  });

  it('distributes cards evenly in round-robin fashion', () => {
    const t = createTable('test-deal-2', 'seed-deal-2');
    joinTable(t, 'p1', 'Alice', 1);
    joinTable(t, 'p2', 'Bob', 2);

    // Get a snapshot of the deck order before dealing
    const deckSnapshot = [...t.deck];

    deal(t, 3);

    // Verify cards are dealt in round-robin order
    // First card to p1, second to p2, third to p1, fourth to p2, etc.
    const expectedP1 = [deckSnapshot[deckSnapshot.length - 1], deckSnapshot[deckSnapshot.length - 3], deckSnapshot[deckSnapshot.length - 5]];
    const expectedP2 = [deckSnapshot[deckSnapshot.length - 2], deckSnapshot[deckSnapshot.length - 4], deckSnapshot[deckSnapshot.length - 6]];

    // Cards are popped from the end, so they're dealt in reverse order
    expect(t.players['p1'].hand).toEqual(expectedP1);
    expect(t.players['p2'].hand).toEqual(expectedP2);
  });

  it('handles deck exhaustion correctly', () => {
    const t = createTable('test-exhaust', 'seed-exhaust');
    joinTable(t, 'p1', 'Alice', 1);
    joinTable(t, 'p2', 'Bob', 2);
    joinTable(t, 'p3', 'Charlie', 3);

    // Try to deal more cards than available (54 cards / 3 players = 18 max per player)
    const outcome = reduceTable(t, { type: 'deal/apply', countPerPlayer: 20 });
    
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error.type).toBe('deal/deck-exhausted');
      if (outcome.error.type === 'deal/deck-exhausted') {
        expect(outcome.error.cardsNeeded).toBe(60); // 3 players × 20 cards
        expect(outcome.error.deckCount).toBe(54);
      }
    }

    // Verify that partial dealing didn't occur - deck should be unchanged
    expect(t.deck).toHaveLength(54);
    expect(t.players['p1'].hand).toHaveLength(0);
    expect(t.players['p2'].hand).toHaveLength(0);
    expect(t.players['p3'].hand).toHaveLength(0);
  });

  it('throws error when dealing from exhausted deck using deal() helper', () => {
    const t = createTable('test-exhaust-throw', 'seed-exhaust-throw');
    joinTable(t, 'p1', 'Alice', 1);
    joinTable(t, 'p2', 'Bob', 2);

    // Manually exhaust the deck
    t.deck = [];

    expect(() => deal(t, 1)).toThrow('Deck exhausted');
  });

  it('deals correctly for Dou Dizhu scenario (3 players, 17 cards each, 3 bottom cards)', () => {
    const t = createTable('test-doudizhu', 'seed-doudizhu');
    joinTable(t, 'p1', 'Alice', 1);
    joinTable(t, 'p2', 'Bob', 2);
    joinTable(t, 'p3', 'Charlie', 3);

    const outcome = reduceTable(t, { type: 'deal/apply', countPerPlayer: 17 });
    
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.result.type === 'deal/dealt') {
      expect(outcome.result.totalDealt).toBe(51); // 3 × 17
      
      // Each player should have 17 cards
      expect(t.players['p1'].hand).toHaveLength(17);
      expect(t.players['p2'].hand).toHaveLength(17);
      expect(t.players['p3'].hand).toHaveLength(17);

      // Deck should have exactly 3 cards left (bottom cards)
      expect(t.deck).toHaveLength(3);

      // Verify all 54 cards are accounted for
      const allCards = [
        ...t.players['p1'].hand,
        ...t.players['p2'].hand,
        ...t.players['p3'].hand,
        ...t.deck
      ];
      expect(allCards).toHaveLength(54);

      // No duplicates
      const cardIds = allCards.map(card => card.id);
      const uniqueIds = new Set(cardIds);
      expect(uniqueIds.size).toBe(54);
    }
  });

  it('clears previous hands before dealing new cards', () => {
    const t = createTable('test-clear-hands', 'seed-clear');
    joinTable(t, 'p1', 'Alice', 1);
    joinTable(t, 'p2', 'Bob', 2);

    // First deal
    deal(t, 3);
    expect(t.players['p1'].hand).toHaveLength(3);
    expect(t.players['p2'].hand).toHaveLength(3);

    // Reset deck for second deal
    reduceTable(t, { type: 'deck/reset', options: { seed: 'seed-clear-2' } });

    // Second deal should clear previous hands
    deal(t, 2);
    expect(t.players['p1'].hand).toHaveLength(2);
    expect(t.players['p2'].hand).toHaveLength(2);
  });

  it('handles dealing with no seats registered', () => {
    const t = createTable('test-no-seats', 'seed-no-seats');

    const outcome = reduceTable(t, { type: 'deal/apply', countPerPlayer: 5 });
    
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.result.type === 'deal/idle') {
      expect(outcome.result.reason).toBe('no-seats');
      expect(outcome.result.cardsPerPlayer).toBe(5);
    }

    // Deck should remain untouched
    expect(t.deck).toHaveLength(54);
  });

  it('handles dealing zero cards per player', () => {
    const t = createTable('test-zero-cards', 'seed-zero');
    joinTable(t, 'p1', 'Alice', 1);

    const outcome = reduceTable(t, { type: 'deal/apply', countPerPlayer: 0 });
    
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.result.type === 'deal/idle') {
      expect(outcome.result.reason).toBe('zero-cards');
      expect(outcome.result.cardsPerPlayer).toBe(0);
    }

    expect(t.players['p1'].hand).toHaveLength(0);
  });

  it('ensures dealt cards maintain proper card structure', () => {
    const t = createTable('test-card-structure', 'seed-structure');
    joinTable(t, 'p1', 'Alice', 1);

    deal(t, 5);

    // Verify each card has the required properties
    for (const card of t.players['p1'].hand) {
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('rank');
      expect(card).toHaveProperty('suit');
      expect(card).toHaveProperty('faceUp');
      expect(typeof card.id).toBe('number');
      expect(typeof card.rank).toBe('string');
      expect(typeof card.suit).toBe('string');
      expect(typeof card.faceUp).toBe('boolean');
    }
  });

  it('deals cards from multiple packs correctly', () => {
    const t = createTable('test-multi-pack', 'seed-multi');
    reduceTable(t, { type: 'deck/reset', options: { packs: 2 } });
    
    joinTable(t, 'p1', 'Alice', 1);
    joinTable(t, 'p2', 'Bob', 2);

    // With 2 packs, we have 108 cards
    expect(t.deck).toHaveLength(108);

    const outcome = reduceTable(t, { type: 'deal/apply', countPerPlayer: 20 });
    
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.result.type === 'deal/dealt') {
      expect(outcome.result.totalDealt).toBe(40);
      expect(t.players['p1'].hand).toHaveLength(20);
      expect(t.players['p2'].hand).toHaveLength(20);
      expect(t.deck).toHaveLength(68); // 108 - 40
    }
  });

  it('prevents duplicate joins from affecting deal count', () => {
    const t = createTable('test-duplicate-join', 'seed-dup');
    
    // Join same seat multiple times
    joinTable(t, 'p1', 'Alice', 1);
    joinTable(t, 'p1', 'Alice', 1); // Duplicate join
    joinTable(t, 'p2', 'Bob', 2);

    // Should only have 2 seats
    expect(t.seats).toHaveLength(2);

    const outcome = reduceTable(t, { type: 'deal/apply', countPerPlayer: 3 });
    
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.result.type === 'deal/dealt') {
      expect(outcome.result.totalDealt).toBe(6); // 2 players × 3 cards
      expect(outcome.result.seats).toEqual(['p1', 'p2']);
    }
  });
});
