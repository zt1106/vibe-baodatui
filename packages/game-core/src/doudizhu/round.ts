import type { GameCard } from '@shared/messages';

import { makeDeck } from '../cards';
import { shuffle } from '../shuffle';
import { beats, classifyCombo } from './combo';
import type { Combo, DdzConfig, Role, Seat } from './types';
import { ComboType, SEATS, normalizeConfig, nextSeat } from './types';
import { advanceTrick } from './trick';

export type BidValue = 0 | 1 | 2 | 3;

export type RoundPhase = 'BIDDING' | 'DOUBLING' | 'PLAY' | 'COMPLETE';

export interface PlayerState {
  seat: Seat;
  role: Role | null;
  hand: GameCard[];
}

export interface BiddingState {
  currentSeat: Seat;
  startingSeat: Seat;
  highestBid: BidValue;
  highestBidder: Seat | null;
  bidsTaken: number;
  consecutivePasses: number;
  history: Array<{ seat: Seat; bid: BidValue }>;
  finished: boolean;
  redealRequired: boolean;
}

export interface DoublingState {
  order: Seat[];
  turnIndex: number;
  defenderDoubles: Partial<Record<Seat, boolean>>;
  landlordRedoubles: boolean;
  finished: boolean;
}

export interface PlayState {
  currentSeat: Seat;
  lastNonPassCombo: Combo | null;
  lastNonPassSeat: Seat | null;
  passCountSinceLastPlay: number;
  playedCombosBySeat: Record<Seat, number>;
  bombCount: number;
  rocketCount: number;
  history: Array<{ seat: Seat; combo: Combo }>;
  winnerSeat: Seat | null;
}

export interface DefenderBreakdown {
  exponent: number;
  multiplier: number;
  score: number;
}

export interface ScoreBreakdown {
  winnerSeat: Seat;
  winnerRole: Role;
  spring: boolean;
  callScore: BidValue;
  bombCount: number;
  rocketCount: number;
  defenders: Record<Seat, DefenderBreakdown | null>;
  landlordScore: number;
  scores: Record<Seat, number>;
}

export interface RoundState {
  seed: string;
  config: Required<DdzConfig>;
  deck: GameCard[];
  bottomCards: GameCard[];
  players: Record<Seat, PlayerState>;
  landlordSeat: Seat | null;
  callScore: BidValue;
  bidding: BiddingState;
  doubling: DoublingState;
  play: PlayState;
  scoring: ScoreBreakdown | null;
  phase: RoundPhase;
}

export interface CreateRoundOptions {
  startingSeat?: Seat;
  config?: Partial<DdzConfig>;
}

export interface ActionResult {
  ok: boolean;
  reason?: string;
  finished?: boolean;
}

export function createRoundState(seed: string, options: CreateRoundOptions = {}): RoundState {
  const config = normalizeConfig(options.config);
  const startingSeat = options.startingSeat ?? 0;
  const shuffled = shuffle(makeDeck(), seed);
  const hands: Record<Seat, GameCard[]> = { 0: [], 1: [], 2: [] };
  let deckIndex = 0;
  for (let i = 0; i < 17; i++) {
    for (const seat of SEATS) {
      const card = shuffled[deckIndex++];
      if (card) {
        hands[seat].push({ ...card });
      }
    }
  }
  const bottomCards = shuffled.slice(deckIndex).map(card => ({ ...card }));
  const players: Record<Seat, PlayerState> = {
    0: { seat: 0, role: null, hand: hands[0] },
    1: { seat: 1, role: null, hand: hands[1] },
    2: { seat: 2, role: null, hand: hands[2] }
  };
  return {
    seed,
    config,
    deck: bottomCards.slice(),
    bottomCards,
    players,
    landlordSeat: null,
    callScore: 0,
    bidding: {
      currentSeat: startingSeat,
      startingSeat,
      highestBid: 0,
      highestBidder: null,
      bidsTaken: 0,
      consecutivePasses: 0,
      history: [],
      finished: false,
      redealRequired: false
    },
    doubling: {
      order: [],
      turnIndex: 0,
      defenderDoubles: {},
      landlordRedoubles: false,
      finished: false
    },
    play: {
      currentSeat: startingSeat,
      lastNonPassCombo: null,
      lastNonPassSeat: null,
      passCountSinceLastPlay: 0,
      playedCombosBySeat: { 0: 0, 1: 0, 2: 0 },
      bombCount: 0,
      rocketCount: 0,
      history: [],
      winnerSeat: null
    },
    scoring: null,
    phase: 'BIDDING'
  };
}

export function applyBid(state: RoundState, seat: Seat, bid: BidValue): ActionResult {
  if (state.phase !== 'BIDDING' || state.bidding.finished) {
    return { ok: false, reason: 'bidding-closed' };
  }
  if (seat !== state.bidding.currentSeat) {
    return { ok: false, reason: 'not-your-turn' };
  }
  if (bid < 0 || bid > 3) {
    return { ok: false, reason: 'invalid-bid' };
  }
  if (bid > 0 && bid <= state.bidding.highestBid) {
    return { ok: false, reason: 'bid-too-low' };
  }

  state.bidding.history.push({ seat, bid });
  state.bidding.bidsTaken += 1;
  if (bid === 0) {
    state.bidding.consecutivePasses += 1;
  } else {
    state.bidding.highestBid = bid;
    state.bidding.highestBidder = seat;
    state.bidding.consecutivePasses = 0;
  }

  let finished = false;
  if (bid === 3) {
    finished = true;
  } else if (state.bidding.bidsTaken >= 3 && state.bidding.highestBidder !== null && state.bidding.consecutivePasses >= 2) {
    finished = true;
  } else if (state.bidding.bidsTaken >= 3 && state.bidding.highestBidder === null) {
    finished = true;
  }

  if (finished) {
    finalizeBidding(state);
    return { ok: true, finished: true };
  }

  state.bidding.currentSeat = nextSeat(seat);
  return { ok: true, finished: false };
}

export function applyDoublingDecision(state: RoundState, seat: Seat, doubled: boolean): ActionResult {
  if (state.phase !== 'DOUBLING' || state.doubling.finished) {
    return { ok: false, reason: 'doubling-closed' };
  }
  const current = state.doubling.order[state.doubling.turnIndex];
  if (current !== seat) {
    return { ok: false, reason: 'not-your-turn' };
  }
  if (seat === state.landlordSeat) {
    state.doubling.landlordRedoubles = doubled;
  } else {
    state.doubling.defenderDoubles[seat] = doubled;
  }
  state.doubling.turnIndex += 1;
  if (state.doubling.turnIndex >= state.doubling.order.length) {
    state.doubling.finished = true;
    state.phase = 'PLAY';
    state.play.currentSeat = state.landlordSeat ?? 0;
    return { ok: true, finished: true };
  }
  return { ok: true, finished: false };
}

export function applyPlay(state: RoundState, seat: Seat, cards: GameCard[]): ActionResult {
  if (state.phase !== 'PLAY' || state.play.winnerSeat !== null) {
    return { ok: false, reason: 'round-complete' };
  }
  if (seat !== state.play.currentSeat) {
    return { ok: false, reason: 'not-your-turn' };
  }
  const player = state.players[seat];
  if (!player) {
    return { ok: false, reason: 'missing-player' };
  }

  const isPass = cards.length === 0;
  const combo = isPass ? ({ type: ComboType.PASS, cards: [] } as Combo) : classifyCombo(cards);
  if (!combo) {
    return { ok: false, reason: 'invalid-combo' };
  }
  if (!isPass && !cardsInHand(player.hand, combo.cards)) {
    return { ok: false, reason: 'cards-not-in-hand' };
  }

  if (!isPass && state.play.lastNonPassCombo && !beats(combo, state.play.lastNonPassCombo)) {
    return { ok: false, reason: 'does-not-beat' };
  }

  const trickAdvance = advanceTrick({
    combo,
    seatId: seat,
    state: {
      lastCombo: state.play.lastNonPassCombo,
      lastSeatId: state.play.lastNonPassSeat,
      passCountSinceLastPlay: state.play.passCountSinceLastPlay
    },
    getNextSeat: nextSeat
  });

  if (!trickAdvance.ok) {
    return { ok: false, reason: trickAdvance.reason };
  }

  if (combo.type === ComboType.PASS) {
    state.play.lastNonPassCombo = trickAdvance.state.lastCombo;
    state.play.lastNonPassSeat = trickAdvance.state.lastSeatId;
    state.play.passCountSinceLastPlay = trickAdvance.state.passCountSinceLastPlay;
    state.play.currentSeat = trickAdvance.nextSeatId;
    return { ok: true, finished: false };
  }

  removeCards(player.hand, combo.cards);
  if (combo.type === ComboType.BOMB) {
    state.play.bombCount += 1;
  } else if (combo.type === ComboType.ROCKET) {
    state.play.rocketCount += 1;
  }
  state.play.playedCombosBySeat[seat] += 1;
  state.play.history.push({ seat, combo });

  state.play.lastNonPassCombo = trickAdvance.state.lastCombo;
  state.play.lastNonPassSeat = trickAdvance.state.lastSeatId;
  state.play.passCountSinceLastPlay = trickAdvance.state.passCountSinceLastPlay;

  if (player.hand.length === 0) {
    finishRound(state, seat);
    return { ok: true, finished: true };
  }

  state.play.currentSeat = trickAdvance.nextSeatId;
  return { ok: true, finished: false };
}

function finalizeBidding(state: RoundState) {
  state.bidding.finished = true;
  if (state.bidding.highestBidder === null || state.bidding.highestBid === 0) {
    state.bidding.redealRequired = true;
    state.phase = 'COMPLETE';
    return;
  }
  const landlordSeat = state.bidding.highestBidder;
  state.landlordSeat = landlordSeat;
  state.callScore = state.bidding.highestBid;

  for (const seat of SEATS) {
    state.players[seat].role = seat === landlordSeat ? 'LANDLORD' : 'FARMER';
  }
  state.players[landlordSeat].hand.push(...state.bottomCards);
  state.bottomCards = [];
  state.deck = [];

  state.doubling.order = buildDoublingOrder(landlordSeat);
  state.doubling.turnIndex = 0;
  state.doubling.defenderDoubles = {};
  state.doubling.landlordRedoubles = false;
  state.doubling.finished = state.doubling.order.length === 0;

  state.phase = state.doubling.finished ? 'PLAY' : 'DOUBLING';
  state.play.currentSeat = landlordSeat;
}

function buildDoublingOrder(landlordSeat: Seat): Seat[] {
  const order: Seat[] = [];
  let cursor = nextSeat(landlordSeat);
  for (let i = 0; i < 2; i++) {
    order.push(cursor);
    cursor = nextSeat(cursor);
  }
  order.push(landlordSeat);
  return order;
}

function cardsInHand(hand: GameCard[], cards: GameCard[]) {
  const counts = new Map<number, number>();
  for (const card of hand) {
    counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
  }
  for (const card of cards) {
    const remaining = (counts.get(card.id) ?? 0) - 1;
    if (remaining < 0) {
      return false;
    }
    counts.set(card.id, remaining);
  }
  return true;
}

function removeCards(hand: GameCard[], cards: GameCard[]) {
  const ids = new Map<number, number>();
  for (const card of cards) {
    ids.set(card.id, (ids.get(card.id) ?? 0) + 1);
  }
  let writeIndex = 0;
  for (let read = 0; read < hand.length; read++) {
    const card = hand[read];
    const needed = ids.get(card.id) ?? 0;
    if (needed > 0) {
      ids.set(card.id, needed - 1);
      continue;
    }
    hand[writeIndex++] = card;
  }
  hand.length = writeIndex;
}

function computeSpring(state: RoundState, winnerRole: Role): boolean {
  if (state.landlordSeat === null) return false;
  const landlordSeat = state.landlordSeat;
  const landlordPlays = state.play.playedCombosBySeat[landlordSeat];
  const farmerPlays = SEATS.filter(seat => seat !== landlordSeat).map(seat => state.play.playedCombosBySeat[seat]);

  const landlordSpring = winnerRole === 'LANDLORD' && farmerPlays.every(count => count === 0);

  const farmerSpring =
    winnerRole === 'FARMER' &&
    landlordPlays === 1 &&
    state.play.history.length > 0 &&
    state.play.history[0]?.seat === landlordSeat;

  return landlordSpring || farmerSpring;
}

function finishRound(state: RoundState, winnerSeat: Seat) {
  if (state.landlordSeat === null) {
    throw new Error('Cannot finish round before landlord is chosen');
  }
  const winnerRole = state.players[winnerSeat].role ?? 'FARMER';
  const spring = computeSpring(state, winnerRole);
  const scoring =
    state.config.scoringMode === 'SIMPLE'
      ? computeSimpleScore(state, winnerSeat, winnerRole, spring)
      : computeCompetitionScore(state, winnerSeat, winnerRole, spring);

  state.play.winnerSeat = winnerSeat;
  state.scoring = scoring;
  state.phase = 'COMPLETE';
  state.play.currentSeat = winnerSeat;
}

function computeCompetitionScore(
  state: RoundState,
  winnerSeat: Seat,
  winnerRole: Role,
  spring: boolean
): ScoreBreakdown {
  const landlordSeat = state.landlordSeat as Seat;
  const farmersWin = winnerRole === 'FARMER';
  const exponentCommon = state.play.bombCount + state.play.rocketCount + (spring ? 1 : 0);
  const defenders: Record<Seat, DefenderBreakdown | null> = { 0: null, 1: null, 2: null };
  const scores: Record<Seat, number> = { 0: 0, 1: 0, 2: 0 };
  let landlordScore = 0;

  const winFactor = farmersWin ? 1 : -1;
  const farmers = SEATS.filter(seat => seat !== landlordSeat);

  for (const seat of farmers) {
    const doubled = state.doubling.defenderDoubles[seat] ?? false;
    const d_i = doubled ? 1 : 0;
    const redoubleApplies = state.doubling.landlordRedoubles && (state.config.usePerDefenderDoubling ? doubled : true);
    const d_L = redoubleApplies ? 1 : 0;
    const exponent = exponentCommon + d_i + d_L;
    const multiplier = 2 ** exponent;
    const score = state.callScore * winFactor * multiplier;
    defenders[seat] = { exponent, multiplier, score };
    scores[seat] = score;
    landlordScore -= score;
  }

  scores[landlordSeat] = landlordScore;

  return {
    winnerSeat,
    winnerRole,
    spring,
    callScore: state.callScore,
    bombCount: state.play.bombCount,
    rocketCount: state.play.rocketCount,
    defenders,
    landlordScore,
    scores
  };
}

function computeSimpleScore(
  state: RoundState,
  winnerSeat: Seat,
  winnerRole: Role,
  spring: boolean
): ScoreBreakdown {
  const landlordSeat = state.landlordSeat as Seat;
  const farmersWin = winnerRole === 'FARMER';
  const exponent = state.play.bombCount + state.play.rocketCount + (spring ? 1 : 0);
  const multiplier = 2 ** exponent;
  const stake = state.callScore * multiplier;
  const defenders: Record<Seat, DefenderBreakdown | null> = { 0: null, 1: null, 2: null };
  const scores: Record<Seat, number> = { 0: 0, 1: 0, 2: 0 };

  for (const seat of SEATS) {
    if (seat === landlordSeat) continue;
    const score = farmersWin ? stake : -stake;
    defenders[seat] = { exponent, multiplier, score };
    scores[seat] = score;
  }

  scores[landlordSeat] = farmersWin ? -2 * stake : 2 * stake;

  return {
    winnerSeat,
    winnerRole,
    spring,
    callScore: state.callScore,
    bombCount: state.play.bombCount,
    rocketCount: state.play.rocketCount,
    defenders,
    landlordScore: scores[landlordSeat],
    scores
  };
}
