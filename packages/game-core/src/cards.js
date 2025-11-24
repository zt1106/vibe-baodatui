import { makeDeck as makeCoreDeck } from '@poker/core-cards';
export function makeDeck(options = {}) {
  const { packs = 2, faceUp = false } = options;
  return makeCoreDeck({ packs, faceUp });
}
