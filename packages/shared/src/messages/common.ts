import { z } from 'zod';

import { AVATAR_FILENAMES } from '../avatars';

export const DomainContractVersion = '2024-12-01' as const;

export const identifierSchema = z.string().min(1);
export const positiveIntSchema = z.number().int().positive();
export const nonNegativeIntSchema = z.number().int().min(0);

export const nicknameSchema = z.string().trim().min(1).max(32);
export const avatarSchema = z.enum(AVATAR_FILENAMES);

export const TableId = identifierSchema;
export type TableId = z.infer<typeof TableId>;

export const SeatId = identifierSchema;
export type SeatId = z.infer<typeof SeatId>;

export const UserId = positiveIntSchema;
export type UserId = z.infer<typeof UserId>;

export const GameVariantId = z.enum(['dou-dizhu']);
export type GameVariantId = z.infer<typeof GameVariantId>;

export const GameVariantCapacity = z
  .object({
    min: positiveIntSchema,
    max: positiveIntSchema,
    locked: positiveIntSchema.optional()
  })
  .refine(value => value.min <= value.max, { message: 'min cannot exceed max' })
  .refine(value => !value.locked || (value.locked >= value.min && value.locked <= value.max), {
    message: 'locked capacity must be within range'
  });
export type GameVariantCapacity = z.infer<typeof GameVariantCapacity>;

export const GameVariantSummary = z.object({
  id: GameVariantId,
  name: z.string().min(1),
  description: z.string().min(1),
  capacity: GameVariantCapacity
});
export type GameVariantSummary = z.infer<typeof GameVariantSummary>;

export const Heartbeat = z.object({
  status: z.enum(['ok', 'degraded']),
  timestamp: nonNegativeIntSchema,
  uptimeMs: nonNegativeIntSchema,
  connections: nonNegativeIntSchema
});
export type Heartbeat = z.infer<typeof Heartbeat>;
