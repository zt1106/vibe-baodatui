import { makeDeck } from './cards';
import { shuffle } from './shuffle';
export function createTable(id, seed) {
  const deck = shuffle(makeDeck({ packs: 2 }), seed);
  return { id, seed, deck, players: {}, seats: [] };
}
export function joinTable(state, seatId, nickname, userId) {
  if (state.players[seatId])
    return state;
  state.players[seatId] = { id: seatId, seatId, userId, nickname, hand: [], hasFolded: false };
  state.seats.push(seatId);
  return state;
}
export function clearHands(state) {
  for (const pid of state.seats) {
    state.players[pid].hand = [];
  }
  return state;
}
export function resetDeck(state, options = {}) {
  const packs = options.packs ?? 2;
  const seed = options.seed ?? state.seed;
  state.seed = seed;
  state.deck = shuffle(makeDeck({ packs }), seed);
  return state;
}
export function drawCard(state, seatId) {
  const card = state.deck.pop();
  if (!card)
    return null;
  const player = state.players[seatId];
  if (!player)
    return null;
  player.hand.push(card);
  return card;
}
export function deal(state, countPerPlayer = 2) {
  clearHands(state);
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
