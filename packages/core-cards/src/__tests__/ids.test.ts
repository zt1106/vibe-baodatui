import { describe, expect, it } from 'vitest';
import {
  CARDS_PER_PACK,
  MAX_PACK_COUNT,
  createCardId,
  parseCardId,
  makeDeck
} from '../ids';

describe('ids', () => {
  it('creates and parses card ids across packs', () => {
    const id = createCardId('A', 'S', 2);
    const parsed = parseCardId(id);
    expect(parsed).toEqual({ rank: 'A', suit: 'S', packIndex: 2 });
  });

  it('rejects invalid pack indexes and rank/suit combinations', () => {
    expect(() => createCardId('A', 'S', -1)).toThrow(RangeError);
    expect(() => createCardId('A', 'S', MAX_PACK_COUNT + 1)).toThrow(RangeError);
    expect(() => createCardId('Z' as never, 'S' as never)).toThrow(RangeError);
    expect(parseCardId(-5)).toBeNull();
    expect(parseCardId(0x1_0000)).toBeNull();
  });

  it('builds decks with the requested pack count and faceUp flag', () => {
    const single = makeDeck({ packs: 1, faceUp: true });
    expect(single).toHaveLength(CARDS_PER_PACK);
    expect(single.every(card => card.faceUp)).toBe(true);

    const double = makeDeck({ packs: 2 });
    expect(double).toHaveLength(CARDS_PER_PACK * 2);
    expect(new Set(double.map(card => card.id)).size).toBe(double.length);
  });
});
