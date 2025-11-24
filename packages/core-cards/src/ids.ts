import type { Card, CardId, JokerSuit, Rank, Suit } from './types';
import { RANKS, SUITS } from './types';

function normalizeRank(rank: Rank) {
  return rank;
}

const JOKER_SUITS: JokerSuit[] = ['JB', 'JR'];
const BASE_CARDS: { rank: Rank; suit: Suit }[] = [];

for (const suit of SUITS) {
  for (const rank of RANKS) {
    BASE_CARDS.push({ rank, suit });
  }
}
for (const suit of JOKER_SUITS) {
  BASE_CARDS.push({ rank: 'Joker', suit });
}

export const CARDS_PER_PACK = BASE_CARDS.length;
const MAX_CARD_ID = 0xffff;
const MAX_PACK_INDEX = Math.floor((MAX_CARD_ID - (CARDS_PER_PACK - 1)) / CARDS_PER_PACK);
export const MAX_PACK_COUNT = MAX_PACK_INDEX + 1;

const CARD_INDEX_MAP = new Map<string, number>();
BASE_CARDS.forEach((card, index) => CARD_INDEX_MAP.set(`${card.rank}${card.suit}`, index));

function resolveCardKey(rank: Rank, suit: Suit) {
  return `${rank}${suit}`;
}

function assertPackIndex(packIndex: number) {
  if (!Number.isFinite(packIndex) || !Number.isInteger(packIndex) || packIndex < 0) {
    throw new RangeError('packIndex must be a non-negative integer');
  }
  if (packIndex > MAX_PACK_INDEX) {
    throw new RangeError(`packIndex exceeds uint16 card id range (max ${MAX_PACK_INDEX})`);
  }
}

export function createCardId(rank: Rank, suit: Suit, packIndex = 0): CardId {
  assertPackIndex(packIndex);
  const baseIndex = CARD_INDEX_MAP.get(resolveCardKey(rank, suit));
  if (baseIndex === undefined) {
    throw new RangeError(`Invalid rank/suit combination: ${rank}${suit}`);
  }
  const id = packIndex * CARDS_PER_PACK + baseIndex;
  if (id > MAX_CARD_ID) {
    throw new RangeError('Card id exceeds uint16 range');
  }
  return id;
}

export function parseCardId(id: number): { rank: Rank; suit: Suit; packIndex: number } | null {
  if (!Number.isFinite(id) || !Number.isInteger(id) || id < 0 || id > MAX_CARD_ID) {
    return null;
  }
  // Each uint16 encodes packIndex * CARDS_PER_PACK + baseIndex, so mod retrieves the underlying card.
  const baseIndex = id % CARDS_PER_PACK;
  const packIndex = Math.floor(id / CARDS_PER_PACK);
  const card = BASE_CARDS[baseIndex];
  if (!card) {
    return null;
  }
  return { rank: card.rank, suit: card.suit, packIndex };
}

type MakeCardOptions = boolean | { faceUp?: boolean; packIndex?: number };

export function makeCard(rank: Rank, suit: Suit, faceUpOrOptions: MakeCardOptions = false): Card {
  const options = typeof faceUpOrOptions === 'boolean' ? { faceUp: faceUpOrOptions } : faceUpOrOptions;
  const { faceUp = false, packIndex = 0 } = options ?? {};
  return {
    id: createCardId(rank, suit, packIndex),
    rank: normalizeRank(rank),
    suit,
    faceUp
  };
}

export interface MakeDeckOptions {
  faceUp?: boolean;
  packs?: number;
}

export function makeDeck(options: MakeDeckOptions = {}): Card[] {
  const { faceUp = false, packs = 1 } = options;
  if (!Number.isFinite(packs) || !Number.isInteger(packs) || packs <= 0) {
    throw new RangeError('packs must be a positive integer');
  }
  if (packs > MAX_PACK_COUNT) {
    throw new RangeError(`Maximum allowed packs is ${MAX_PACK_COUNT}`);
  }
  const cards: Card[] = [];
  for (let packIndex = 0; packIndex < packs; packIndex += 1) {
    for (const baseCard of BASE_CARDS) {
      cards.push({
        id: createCardId(baseCard.rank, baseCard.suit, packIndex),
        rank: normalizeRank(baseCard.rank),
        suit: baseCard.suit,
        faceUp
      });
    }
  }
  return cards;
}

export function isCardId(value: number): value is CardId {
  return parseCardId(value) != null;
}
