import { Card, CardId, Rank, RANKS, Suit, SUITS, JokerSuit } from './types';

function normalizeRank(rank: Rank) {
  return rank;
}

export function createCardId(rank: Rank, suit: Suit): CardId {
  return `${rank}${suit}` as CardId;
}

const JOKER_SUITS = ['JB', 'JR'] as JokerSuit[];
const RANK_PATTERN = [...RANKS, 'Joker'].join('|');
const SUIT_PATTERN = [...SUITS, ...JOKER_SUITS].join('|');

export function parseCardId(id: string): { rank: Rank; suit: Suit } | null {
  const match = id.match(new RegExp(`^(${RANK_PATTERN})(${SUIT_PATTERN})$`));
  if (!match) return null;
  const [, rank, suit] = match;
  return { rank: rank as Rank, suit: suit as Suit };
}

export function makeCard(rank: Rank, suit: Suit, faceUp = false): Card {
  return {
    id: createCardId(rank, suit),
    rank: normalizeRank(rank),
    suit,
    faceUp
  };
}

export function makeDeck(options: { faceUp?: boolean } = {}): Card[] {
  const { faceUp = false } = options;
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push(makeCard(rank, suit, faceUp));
    }
  }
  for (const suit of JOKER_SUITS) {
    cards.push(makeCard('Joker', suit, faceUp));
  }
  return cards;
}

export function isCardId(value: string): value is CardId {
  return parseCardId(value) != null;
}
