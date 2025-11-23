import type { GameCard } from '@shared/messages';

export type Seat = 0 | 1 | 2;
export const SEATS: Seat[] = [0, 1, 2];

export type Role = 'LANDLORD' | 'FARMER';

export type RankValue = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17;

type NonJokerRank = Exclude<GameCard['rank'], 'Joker'>;
const NON_JOKER_RANK_VALUE: Record<NonJokerRank, RankValue> = {
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
  '2': 15
};

export enum ComboType {
  PASS = 'PASS',
  SINGLE = 'SINGLE',
  PAIR = 'PAIR',
  TRIPLE = 'TRIPLE',
  TRIPLE_WITH_SINGLE = 'TRIPLE_WITH_SINGLE',
  TRIPLE_WITH_PAIR = 'TRIPLE_WITH_PAIR',
  SEQUENCE = 'SEQUENCE',
  SEQUENCE_OF_PAIRS = 'SEQUENCE_OF_PAIRS',
  PLANE = 'PLANE',
  PLANE_WITH_SINGLES = 'PLANE_WITH_SINGLES',
  PLANE_WITH_PAIRS = 'PLANE_WITH_PAIRS',
  FOUR_WITH_TWO_SINGLES = 'FOUR_WITH_TWO_SINGLES',
  FOUR_WITH_TWO_PAIRS = 'FOUR_WITH_TWO_PAIRS',
  BOMB = 'BOMB',
  ROCKET = 'ROCKET'
}

export interface Combo {
  type: ComboType;
  mainRank?: RankValue;
  length?: number;
  cards: GameCard[];
}

export interface DdzConfig {
  scoringMode?: 'COMPETITION' | 'SIMPLE';
  usePerDefenderDoubling?: boolean;
  allowQuadplexAsBomb?: boolean;
  revealBottomCardsBeforeMerge?: boolean;
}

export const DEFAULT_DDZ_CONFIG: Required<DdzConfig> = {
  scoringMode: 'COMPETITION',
  usePerDefenderDoubling: true,
  allowQuadplexAsBomb: false,
  revealBottomCardsBeforeMerge: false
};

export function normalizeConfig(config?: Partial<DdzConfig>): Required<DdzConfig> {
  return { ...DEFAULT_DDZ_CONFIG, ...(config ?? {}) };
}

export function rankValue(card: GameCard): RankValue {
  if (card.rank === 'Joker') {
    return card.suit === 'JR' ? 17 : 16;
  }
  const value = NON_JOKER_RANK_VALUE[card.rank];
  if (!value) {
    throw new Error(`Unsupported rank: ${card.rank}`);
  }
  return value;
}

export function isSmallJoker(card: GameCard) {
  return card.rank === 'Joker' && card.suit === 'JB';
}

export function isBigJoker(card: GameCard) {
  return card.rank === 'Joker' && card.suit === 'JR';
}

export function sortCardsByRank(cards: GameCard[]): GameCard[] {
  return [...cards].sort((a, b) => {
    const diff = rankValue(a) - rankValue(b);
    if (diff !== 0) {
      return diff;
    }
    return a.id - b.id;
  });
}

export function nextSeat(seat: Seat): Seat {
  return ((seat + 1) % 3) as Seat;
}
