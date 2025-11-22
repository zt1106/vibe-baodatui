import type { GameCard, SeatId, TableId, UserId } from '@shared/messages';

import { makeDeck } from './cards';
import { shuffle } from './shuffle';

export interface PlayerState {
  id: SeatId;
  seatId: SeatId;
  userId: UserId;
  nickname: string;
  hand: GameCard[];
  hasFolded: boolean;
}

export interface TableState {
  id: TableId;
  seed: string;
  deck: GameCard[];
  players: Record<SeatId, PlayerState>;
  seats: SeatId[]; // ordered player ids
}

export interface ResetDeckOptions {
  packs?: number;
  seed?: string;
}

type SeatJoinAction = {
  type: 'seat/join';
  seatId: SeatId;
  nickname: string;
  userId: UserId;
};

type SeatClearHandsAction = { type: 'seat/clear-hands' };

type DeckResetAction = { type: 'deck/reset'; options?: ResetDeckOptions };

type DeckDrawAction = { type: 'deck/draw'; seatId: SeatId };

type DealCardsAction = { type: 'deal/apply'; countPerPlayer?: number };

export type TableAction = SeatJoinAction | SeatClearHandsAction | DeckResetAction | DeckDrawAction | DealCardsAction;

export type TableActionResult =
  | { type: 'seat/joined'; player: PlayerState; created: boolean }
  | { type: 'seat/hands-cleared'; seats: SeatId[] }
  | { type: 'deck/reset'; seed: string; packs: number; deckCount: number }
  | { type: 'deck/card-drawn'; seatId: SeatId; card: GameCard }
  | {
      type: 'deal/dealt';
      seats: SeatId[];
      cardsPerPlayer: number;
      totalDealt: number;
      hands: Record<SeatId, GameCard[]>;
    }
  | { type: 'deal/idle'; reason: 'no-seats' | 'zero-cards'; cardsPerPlayer: number };

export type TableReducerError =
  | { type: 'seat/missing'; seatId: SeatId }
  | { type: 'deck/empty'; seatId?: SeatId }
  | { type: 'deal/deck-exhausted'; cardsNeeded: number; deckCount: number };

export interface TableReducerSuccess<
  A extends TableAction = TableAction,
  R extends TableActionResult = TableActionResult
> {
  ok: true;
  action: A;
  state: TableState;
  result: R;
}

export interface TableReducerFailure<
  A extends TableAction = TableAction,
  E extends TableReducerError = TableReducerError
> {
  ok: false;
  action: A;
  state: TableState;
  error: E;
}

export type TableReducerResult<A extends TableAction = TableAction> =
  | TableReducerSuccess<A>
  | TableReducerFailure<A>;

const DEFAULT_DEAL_COUNT = 2;

export function createTable(id: TableId, seed: string): TableState {
  const deck = shuffle(makeDeck({ packs: 2 }), seed);
  return { id, seed, deck, players: {}, seats: [] };
}

export function joinTable(state: TableState, seatId: SeatId, nickname: string, userId: UserId) {
  reduceTable(state, { type: 'seat/join', seatId, nickname, userId });
  return state;
}

export function clearHands(state: TableState) {
  reduceTable(state, { type: 'seat/clear-hands' });
  return state;
}

export function resetDeck(state: TableState, options: ResetDeckOptions = {}) {
  reduceTable(state, { type: 'deck/reset', options });
  return state;
}

export function drawCard(state: TableState, seatId: SeatId) {
  const outcome = reduceTable(state, { type: 'deck/draw', seatId });
  if (!outcome.ok) {
    return null;
  }
  return outcome.result.card;
}

export function deal(state: TableState, countPerPlayer = 2) {
  const outcome = reduceTable(state, { type: 'deal/apply', countPerPlayer });
  if (!outcome.ok && outcome.error.type === 'deal/deck-exhausted') {
    throw new Error('Deck exhausted');
  }
  if (!outcome.ok && outcome.error.type === 'seat/missing') {
    throw new Error(`Seat ${outcome.error.seatId} missing`);
  }
  return state;
}

export function reduceTable(state: TableState, action: TableAction): TableReducerResult {
  switch (action.type) {
    case 'seat/join':
      return success(state, action, applySeatJoin(state, action));
    case 'seat/clear-hands':
      return success(state, action, applyClearHands(state));
    case 'deck/reset':
      return success(state, action, applyResetDeck(state, action.options));
    case 'deck/draw':
      return applyDrawCard(state, action);
    case 'deal/apply':
      return applyDeal(state, action);
  }
}

function success<A extends TableAction, R extends TableActionResult>(
  state: TableState,
  action: A,
  result: R
): TableReducerSuccess<A, R> {
  return { ok: true, action, state, result };
}

function failure<A extends TableAction, E extends TableReducerError>(
  state: TableState,
  action: A,
  error: E
): TableReducerFailure<A, E> {
  return { ok: false, action, state, error };
}

function applySeatJoin(state: TableState, action: SeatJoinAction): Extract<TableActionResult, { type: 'seat/joined' }> {
  const existing = state.players[action.seatId];
  if (existing) {
    return { type: 'seat/joined', player: existing, created: false };
  }
  const player: PlayerState = {
    id: action.seatId,
    seatId: action.seatId,
    userId: action.userId,
    nickname: action.nickname,
    hand: [],
    hasFolded: false
  };
  state.players[action.seatId] = player;
  state.seats.push(action.seatId);
  return { type: 'seat/joined', player, created: true };
}

function applyClearHands(state: TableState): Extract<TableActionResult, { type: 'seat/hands-cleared' }> {
  const cleared: SeatId[] = [];
  for (const pid of state.seats) {
    const player = state.players[pid];
    if (!player) continue;
    player.hand = [];
    cleared.push(pid);
  }
  return { type: 'seat/hands-cleared', seats: cleared };
}

function applyResetDeck(
  state: TableState,
  options: ResetDeckOptions | undefined
): Extract<TableActionResult, { type: 'deck/reset' }> {
  const packs = options?.packs ?? 2;
  const seed = options?.seed ?? state.seed;
  state.seed = seed;
  state.deck = shuffle(makeDeck({ packs }), seed);
  return { type: 'deck/reset', seed, packs, deckCount: state.deck.length };
}

function applyDrawCard(state: TableState, action: DeckDrawAction): TableReducerResult<DeckDrawAction> {
  const player = state.players[action.seatId];
  if (!player) {
    return failure(state, action, { type: 'seat/missing', seatId: action.seatId });
  }
  if (state.deck.length === 0) {
    return failure(state, action, { type: 'deck/empty', seatId: action.seatId });
  }
  const card = state.deck.pop();
  if (!card) {
    return failure(state, action, { type: 'deck/empty', seatId: action.seatId });
  }
  player.hand.push(card);
  return success(state, action, { type: 'deck/card-drawn', seatId: action.seatId, card });
}

function applyDeal(state: TableState, action: DealCardsAction): TableReducerResult<DealCardsAction> {
  const cardsPerPlayer = action.countPerPlayer ?? DEFAULT_DEAL_COUNT;
  if (cardsPerPlayer <= 0) {
    return success(state, action, { type: 'deal/idle', reason: 'zero-cards', cardsPerPlayer });
  }
  const seats = state.seats.slice();
  if (seats.length === 0) {
    return success(state, action, { type: 'deal/idle', reason: 'no-seats', cardsPerPlayer });
  }
  const cardsNeeded = seats.length * cardsPerPlayer;
  if (state.deck.length < cardsNeeded) {
    return failure(state, action, { type: 'deal/deck-exhausted', cardsNeeded, deckCount: state.deck.length });
  }
  applyClearHands(state);
  const hands: Record<SeatId, GameCard[]> = {};
  for (const seatId of seats) {
    hands[seatId] = [];
  }
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (const seatId of seats) {
      const draw = applyDrawCard(state, { type: 'deck/draw', seatId });
      if (!draw.ok) {
        return failure(state, action, draw.error);
      }
      hands[seatId].push(draw.result.card);
    }
  }
  return success(state, action, {
    type: 'deal/dealt',
    seats,
    cardsPerPlayer,
    totalDealt: seats.length * cardsPerPlayer,
    hands
  });
}
