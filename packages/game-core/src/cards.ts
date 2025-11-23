import type { GameCard } from '@shared/messages';
import { makeDeck as makeCoreDeck } from '@poker/core-cards';

export type { GameCard };

export interface GameDeckOptions {
  packs?: number;
  faceUp?: boolean;
}

export function makeDeck(options: GameDeckOptions = {}): GameCard[] {
  const { packs = 1, faceUp = false } = options;
  return makeCoreDeck({ packs, faceUp });
}
