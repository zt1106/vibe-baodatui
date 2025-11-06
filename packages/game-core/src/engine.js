import { makeDeck } from './cards';
import { shuffle } from './shuffle';
export function createTable(id, seed) {
    const deck = shuffle(makeDeck(), seed);
    return { id, seed, deck, players: {}, seats: [], pot: 0 };
}
export function joinTable(state, playerId, nickname, buyin = 1000) {
    if (state.players[playerId])
        return state; // idempotent
    state.players[playerId] = { id: playerId, nickname, chips: buyin, hand: [], hasFolded: false };
    state.seats.push(playerId);
    return state;
}
export function deal(state, countPerPlayer = 2) {
    for (const pid of state.seats) {
        state.players[pid].hand = [];
    }
    for (let i = 0; i < countPerPlayer; i++) {
        for (const pid of state.seats) {
            const card = state.deck.pop();
            if (!card)
                throw new Error('Deck exhausted');
            state.players[pid].hand.push(card);
        }
    }
    return state;
}
export function bet(state, playerId, chips) {
    const p = state.players[playerId];
    if (!p)
        throw new Error('No such player');
    if (chips < 0 || chips > p.chips)
        throw new Error('Invalid bet');
    p.chips -= chips;
    state.pot += chips;
    return state;
}
