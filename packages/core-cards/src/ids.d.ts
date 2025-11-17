import { Card, CardId, Rank, Suit } from './types';
export declare const CARDS_PER_PACK: number;
export declare const MAX_PACK_COUNT: number;
export declare function createCardId(rank: Rank, suit: Suit, packIndex?: number): CardId;
export declare function parseCardId(id: number): {
    rank: Rank;
    suit: Suit;
    packIndex: number;
} | null;
type MakeCardOptions = boolean | {
    faceUp?: boolean;
    packIndex?: number;
};
export declare function makeCard(rank: Rank, suit: Suit, faceUpOrOptions?: MakeCardOptions): Card;
export interface MakeDeckOptions {
    faceUp?: boolean;
    packs?: number;
}
export declare function makeDeck(options?: MakeDeckOptions): Card[];
export declare function isCardId(value: number): value is CardId;
export {};
