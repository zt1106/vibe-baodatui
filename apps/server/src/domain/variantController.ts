import type { GameSnapshot } from '@shared/messages';
import type { ManagedTable } from './tableTypes';

export type VariantSnapshot = Partial<
  Pick<GameSnapshot, 'bidding' | 'doubling' | 'lastCombo' | 'trickCombos' | 'callScore' | 'landlordSeatId' | 'currentTurnSeatId'>
> & {
  deckCount?: number;
};

export interface VariantController {
  start(table: ManagedTable): void;
  buildSnapshot?(table: ManagedTable): VariantSnapshot;
  resolveCurrentTurnSeatId?(table: ManagedTable, lastDealtSeatId?: string): string | undefined;
}
