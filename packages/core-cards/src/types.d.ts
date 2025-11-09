export type StandardSuit = 'S' | 'H' | 'D' | 'C';
export type JokerSuit = 'JB' | 'JR';
export type Suit = StandardSuit | JokerSuit;
export type SuitSymbol = '♠' | '♥' | '♦' | '♣' | '🃏';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'Joker';
export type CardId = number;
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
export declare const SUITS: StandardSuit[];
export declare const RANKS: Rank[];
export declare const SUIT_SYMBOLS: Record<Suit, SuitSymbol>;
export declare const SYMBOL_TO_SUIT: Record<SuitSymbol, Suit>;
export type SuitTint = 'black' | 'red';
export declare const SUIT_TINT: Record<Suit, SuitTint>;
