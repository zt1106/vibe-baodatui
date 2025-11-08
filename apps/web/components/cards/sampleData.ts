import type { Card } from '@poker/core-cards';
import { makeDeck, shuffleDeck } from '@poker/core-cards';

function tagCard(card: Card, seatIndex: number, cardIndex: number): Card {
  return {
    ...card,
    faceUp: true,
    meta: {
      ownerSeat: seatIndex + 1,
      selectable: true,
      tags: cardIndex === 0 ? ['BTN'] : cardIndex === 3 ? ['Action'] : undefined
    }
  };
}

export function createSampleHand(seed = 0, count = 5): Card[] {
  const deck = shuffleDeck(makeDeck({ faceUp: true }), `hand-${seed}`);
  return deck.slice(0, count).map((card, index) => tagCard(card, 0, index));
}

export interface SampleRowsOptions {
  rows?: number;
  cardsPerRow?: number;
  seed?: number;
}

export function createSampleRows({ rows = 3, cardsPerRow = 5, seed = 0 }: SampleRowsOptions = {}): Card[][] {
  const deck = shuffleDeck(makeDeck({ faceUp: true }), `rows-${seed}`);
  const sets: Card[][] = [];
  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const start = rowIndex * cardsPerRow;
    const cards = deck.slice(start, start + cardsPerRow).map((card, column) => tagCard(card, rowIndex, column));
    sets.push(cards);
  }
  return sets;
}
