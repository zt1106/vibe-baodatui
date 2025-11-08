export type Suit = 'S' | 'H' | 'D' | 'C';
export type SuitSymbol = '♠' | '♥' | '♦' | '♣';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type CardId = `${Rank}${Suit}`;
export type CardSize = 'xs' | 'sm' | 'md' | 'lg';

export interface CardMeta {
  ownerSeat?: number;
  selectable?: boolean;
  tags?: string[];
}

export interface Card {
  id: CardId;
  rank: Rank;
  suit: Suit;
  faceUp: boolean;
  meta?: CardMeta;
}

export interface CardLayout {
  x: number;
  y: number;
  rot: number;
}

export const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOLS: Record<Suit, SuitSymbol> = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣'
};

export const SYMBOL_TO_SUIT: Record<SuitSymbol, Suit> = {
  '♠': 'S',
  '♥': 'H',
  '♦': 'D',
  '♣': 'C'
};

export type SuitTint = 'black' | 'red';
export const SUIT_TINT: Record<Suit, SuitTint> = {
  S: 'black',
  C: 'black',
  H: 'red',
  D: 'red'
};
