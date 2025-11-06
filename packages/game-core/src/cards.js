export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
export function makeDeck() {
    const deck = [];
    for (const s of SUITS)
        for (const r of RANKS)
            deck.push({ suit: s, rank: r });
    return deck;
}
