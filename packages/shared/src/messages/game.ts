import { z } from 'zod';

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

export const GamePhase = z.enum(['idle', 'dealing', 'complete']);
export type GamePhase = z.infer<typeof GamePhase>;

export const GameSeatState = PlayerIdentity.extend({
  seatId: SeatId,
  handCount: nonNegativeIntSchema,
  isHost: z.boolean()
});
export type GameSeatState = z.infer<typeof GameSeatState>;

export const GameSnapshot = z.object({
  tableId: TableId,
  phase: GamePhase,
  deckCount: nonNegativeIntSchema,
  lastDealtSeatId: SeatId.optional(),
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

export { CardRank, CardSuit };
