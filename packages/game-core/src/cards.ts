
export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = 'A'|'K'|'Q'|'J'|'10'|'9'|'8'|'7'|'6'|'5'|'4'|'3'|'2';
export interface Card { suit: Suit; rank: Rank; }

export const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
export const RANKS: Rank[] = ['A','K','Q','J','10','9','8','7','6','5','4','3','2'];

export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({ suit: s, rank: r });
  return deck;
}
