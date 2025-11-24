import { z } from 'zod';

import { SeatId, UserId, nonNegativeIntSchema } from './common';

const ScoreFactors = z.object({
  bombs: nonNegativeIntSchema,
  rockets: nonNegativeIntSchema,
  spring: z.boolean(),
  defenderDouble: z.boolean(),
  landlordRedouble: z.boolean()
});

const PlayerScore = z.object({
  userId: UserId,
  seatId: SeatId,
  role: z.enum(['LANDLORD', 'FARMER']),
  nickname: z.string(),
  score: z.number(),
  doubled: z.boolean().optional(),
  exponent: z.number().int().nullable().optional(),
  multiplier: z.number().nullable().optional(),
  factors: ScoreFactors
});

export const GameResult = z.object({
  winner: z.enum(['LANDLORD', 'FARMERS']),
  landlordUserId: UserId.nullable(),
  winningUserIds: z.array(UserId),
  finishedAt: z.number().int().nonnegative(),
  callScore: z.number().int().nonnegative(),
  bombCount: nonNegativeIntSchema,
  rocketCount: nonNegativeIntSchema,
  spring: z.boolean(),
  landlordRedoubled: z.boolean(),
  usePerDefenderDoubling: z.boolean(),
  scores: z.array(PlayerScore)
});
export type GameResult = z.infer<typeof GameResult>;
