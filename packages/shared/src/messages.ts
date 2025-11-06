
import { z } from 'zod';

export const JoinTable = z.object({
  tableId: z.string().min(1),
  nickname: z.string().min(1)
});
export type JoinTable = z.infer<typeof JoinTable>;

export const Bet = z.object({
  tableId: z.string().min(1),
  chips: z.number().int().min(0)
});
export type Bet = z.infer<typeof Bet>;

export const ServerState = z.object({
  tableId: z.string(),
  seats: z.array(z.object({ id: z.string(), nickname: z.string(), chips: z.number().int() })),
  pot: z.number().int(),
});
export type ServerState = z.infer<typeof ServerState>;
