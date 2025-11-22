import { makeDeck } from '@game-core/cards';
import { createTable, resetDeck, type TableState } from '@game-core/engine';
import { shuffle } from '@game-core/shuffle';
import type { GameCard } from '@shared/messages';

export type SeededDeckOptions = {
  packs?: number;
  faceUp?: boolean;
};

export function makeSeededDeck(seed: string, options: SeededDeckOptions = {}): GameCard[] {
  const baseDeck = makeDeck({ packs: options.packs, faceUp: options.faceUp });
  const shuffled = shuffle(baseDeck, seed);
  return shuffled.map(card => ({ ...card }));
}

export function createSeededTableState(
  tableId: string,
  seed: string,
  options: { packs?: number } = {}
): TableState {
  const state = createTable(tableId, seed);
  resetDeck(state, { seed, packs: options.packs });
  return state;
}
