import type { Card } from '@poker/core-cards';
import { makeDeck as makeCoreDeck } from '@poker/core-cards';

export type { Card };

export interface GameDeckOptions {
  packs?: number;
  faceUp?: boolean;
}

export function makeDeck(options: GameDeckOptions = {}): Card[] {
  const { packs = 2, faceUp = false } = options;
  return makeCoreDeck({ packs, faceUp });
}
