import { z } from 'zod';

import { TABLE_PHASE_STATUSES, type TablePhaseStatus } from '../tablePhases';
import { GameVariantSummary, SeatId, TableId, nonNegativeIntSchema } from './common';
import { PlayerIdentity } from './table';

const CardSuit = z.enum(['S', 'H', 'D', 'C', 'JB', 'JR']);
const CardRank = z.enum(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'Joker']);

const CardMeta = z
  .object({
    ownerSeat: nonNegativeIntSchema.optional(),
    selectable: z.boolean().optional(),
    tags: z.array(z.string()).optional()
  })
  .partial();

export const GameCard = z.object({
  id: z.number().int().nonnegative(),
  rank: CardRank,
  suit: CardSuit,
  faceUp: z.boolean(),
  meta: CardMeta.optional()
});
export type GameCard = z.infer<typeof GameCard>;

export const GamePhase = z.enum(TABLE_PHASE_STATUSES);
export type GamePhase = TablePhaseStatus;

export const GameSeatState = PlayerIdentity.extend({
  seatId: SeatId,
  handCount: nonNegativeIntSchema,
  isHost: z.boolean()
});
export type GameSeatState = z.infer<typeof GameSeatState>;

export const ComboTypeEnum = z.enum([
  'PASS',
  'SINGLE',
  'PAIR',
  'TRIPLE',
  'TRIPLE_WITH_SINGLE',
  'TRIPLE_WITH_PAIR',
  'SEQUENCE',
  'SEQUENCE_OF_PAIRS',
  'PLANE',
  'PLANE_WITH_SINGLES',
  'PLANE_WITH_PAIRS',
  'FOUR_WITH_TWO_SINGLES',
  'FOUR_WITH_TWO_PAIRS',
  'BOMB',
  'ROCKET'
]);
export type ComboTypeEnum = z.infer<typeof ComboTypeEnum>;

export const GameCombo = z.object({
  seatId: SeatId,
  type: ComboTypeEnum,
  cards: z.array(GameCard),
  mainRank: z.number().int().optional(),
  length: z.number().int().optional()
});
export type GameCombo = z.infer<typeof GameCombo>;

export const BiddingState = z.object({
  currentSeatId: SeatId,
  startingSeatId: SeatId,
  highestBid: z.number().int().min(0).max(3),
  highestBidderSeatId: SeatId.nullable(),
  bidsTaken: nonNegativeIntSchema,
  consecutivePasses: nonNegativeIntSchema,
  finished: z.boolean(),
  redealRequired: z.boolean().optional()
});
export type BiddingState = z.infer<typeof BiddingState>;

export const DoublingState = z.object({
  currentSeatId: SeatId,
  defenderDoubles: z.record(SeatId, z.boolean().optional()),
  landlordRedoubled: z.boolean().optional(),
  finished: z.boolean()
});
export type DoublingState = z.infer<typeof DoublingState>;

export const GameSnapshot = z.object({
  tableId: TableId,
  phase: GamePhase,
  deckCount: nonNegativeIntSchema,
  lastDealtSeatId: SeatId.optional(),
  currentTurnSeatId: SeatId.optional(),
  landlordSeatId: SeatId.optional(),
  bidding: BiddingState.optional(),
  doubling: DoublingState.optional(),
  callScore: z.number().int().min(0).max(3).optional(),
  lastCombo: GameCombo.optional(),
  variant: GameVariantSummary,
  seats: z.array(GameSeatState)
});
export type GameSnapshot = z.infer<typeof GameSnapshot>;

export const GameDealCardEvent = z.object({
  tableId: TableId,
  seatId: SeatId,
  card: GameCard
});
export type GameDealCardEvent = z.infer<typeof GameDealCardEvent>;

export const TablePlayStateResponse = z.object({
  snapshot: GameSnapshot,
  hand: z.array(GameCard)
});
export type TablePlayStateResponse = z.infer<typeof TablePlayStateResponse>;

export const GameBidRequest = z.object({
  tableId: TableId,
  bid: z.number().int().min(0).max(3)
});
export type GameBidRequest = z.infer<typeof GameBidRequest>;

export const GameDoubleRequest = z.object({
  tableId: TableId,
  double: z.boolean()
});
export type GameDoubleRequest = z.infer<typeof GameDoubleRequest>;

export const GamePlayRequest = z.object({
  tableId: TableId,
  cardIds: z.array(z.number().int().nonnegative())
});
export type GamePlayRequest = z.infer<typeof GamePlayRequest>;

export { CardRank, CardSuit };
