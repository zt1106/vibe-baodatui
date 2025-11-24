import { z } from 'zod';

import { UserId } from './common';

export const GameResult = z.object({
  winner: z.enum(['LANDLORD', 'FARMERS']),
  landlordUserId: UserId.nullable(),
  winningUserIds: z.array(UserId),
  finishedAt: z.number().int().nonnegative()
});
export type GameResult = z.infer<typeof GameResult>;
