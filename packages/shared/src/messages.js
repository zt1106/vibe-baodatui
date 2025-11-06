import { z } from 'zod';
export const JoinTable = z.object({
    tableId: z.string().min(1),
    nickname: z.string().min(1)
});
export const Bet = z.object({
    tableId: z.string().min(1),
    chips: z.number().int().min(0)
});
export const ServerState = z.object({
    tableId: z.string(),
    seats: z.array(z.object({ id: z.string(), nickname: z.string(), chips: z.number().int() })),
    pot: z.number().int(),
});
export const Heartbeat = z.object({
    status: z.literal('ok'),
    timestamp: z.number().int(),
    uptimeMs: z.number().int().min(0),
    connections: z.number().int().min(0)
});
