import { makeDeck } from './cards';
import { shuffle } from './shuffle';
export function createTable(id, seed) {
    const deck = shuffle(makeDeck(), seed);
    return { id, seed, deck, players: {}, seats: [] };
}
export function joinTable(state, playerId, nickname, userId) {
    if (state.players[playerId])
        return state; // idempotent
    state.players[playerId] = { id: playerId, userId, nickname, hand: [], hasFolded: false };
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
