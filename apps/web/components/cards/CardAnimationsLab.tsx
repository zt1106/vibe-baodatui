'use client';

import { useMemo, useState } from 'react';

import { makeDeck, shuffleDeck, type Card } from '@poker/core-cards';
import { CardRow, CardStack } from '@poker/ui-cards';

function decorateCard(card: Card, seatIndex: number, cardIndex: number): Card {
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

export interface CardAnimationsLabProps {
  seats?: number;
  cardsPerSeat?: number;
  overlap?: number;
}

export function CardAnimationsLab({ seats = 3, cardsPerSeat = 5, overlap = 0.4 }: CardAnimationsLabProps) {
  const [seed, setSeed] = useState(0);
  const { rows, drawPileCount } = useMemo(() => {
    const deck = shuffleDeck(makeDeck({ faceUp: true }), `lab-${seed}`);
    const nextRows: Card[][] = [];
    const totalCards = seats * cardsPerSeat;
    for (let seatIndex = 0; seatIndex < seats; seatIndex += 1) {
      const start = seatIndex * cardsPerSeat;
      const cards = deck.slice(start, start + cardsPerSeat).map((card, cardIndex) => decorateCard(card, seatIndex, cardIndex));
      nextRows.push(cards);
    }
    return {
      rows: nextRows,
      drawPileCount: Math.max(deck.length - totalCards, 0)
    };
  }, [cardsPerSeat, seats, seed]);

  return (
    <section
      style={{
        borderRadius: 32,
        border: '1px solid rgba(148, 163, 184, 0.3)',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(8, 47, 73, 0.8))',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: 'min(960px, 100%)'
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0 }}>Animations Lab</h3>
          <p style={{ margin: '0.35rem 0 0', opacity: 0.7 }}>Preview dealing, overlap, and layout tweaks without joining a table.</p>
        </div>
        <button
          type="button"
          onClick={() => setSeed(value => value + 1)}
          style={{
            padding: '0.65rem 1.1rem',
            borderRadius: 16,
            border: '1px solid rgba(56, 189, 248, 0.5)',
            background: 'rgba(14, 165, 233, 0.2)',
            color: '#e0f2fe',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Deal again
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {rows.map((cards, index) => (
          <CardRow
            key={`lab-row-${index}`}
            cards={cards}
            overlap={overlap}
            layoutIdPrefix={`lab-row-${index}`}
            selectMode="multi"
            align="center"
            orientation={index % 2 ? 'top' : 'bottom'}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <CardStack count={drawPileCount} topCard={rows[0]?.[0]} label="Draw pile" faceUpTop={false} />
        <CardStack count={rows.flat().length} topCard={rows[rows.length - 1]?.[0]} faceUpTop label="Dealt" backVariant="blue" />
      </div>
    </section>
  );
}
