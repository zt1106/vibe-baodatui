'use client';

import { useMemo, useState } from 'react';

import { makeDeck, shuffleDeck } from '@poker/core-cards';
import { CardStack } from '@poker/ui-cards';
import { SingleCard } from './SingleCard';

export function CardShowcase() {
  const [seed, setSeed] = useState(0);
  const sampleHand = useMemo(() => {
    const deck = shuffleDeck(makeDeck({ faceUp: true }), `seed-${seed}`);
    return deck.slice(0, 5).map((card, index) => ({
      ...card,
      meta: {
        ownerSeat: 1,
        selectable: true,
        tags: index === 0 ? ['BTN'] : index === 3 ? ['Action'] : undefined
      }
    }));
  }, [seed]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastInteraction, setLastInteraction] = useState<string | null>(null);

  const toggleCard = (cardId: string) => {
    setSelectedIds(prev => {
      const next = prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId];
      setLastInteraction(next.length ? `选中 ${next.length} 张` : '未选择任何卡牌');
      return next;
    });
  };

  return (
    <section
      style={{
        borderRadius: 24,
        border: '1px solid rgba(148, 163, 184, 0.28)',
        background: 'rgba(15, 23, 42, 0.78)',
        padding: '1.25rem',
        display: 'grid',
        gap: '1rem',
        boxShadow: '0 24px 60px rgba(15, 23, 42, 0.35)'
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>牌面预览</h3>
          <p style={{ margin: '0.35rem 0 0', opacity: 0.7 }}>新 UI 组件实时渲染示例</p>
        </div>
        <button
          type="button"
          onClick={() => setSeed(seed => seed + 1)}
          style={{
            padding: '0.5rem 0.9rem',
            borderRadius: 12,
            border: '1px solid rgba(56, 189, 248, 0.5)',
            background: 'rgba(14, 165, 233, 0.15)',
            color: '#bae6fd',
            cursor: 'pointer'
          }}
        >
          随机新手牌
        </button>
      </header>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem 0'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 0
          }}
        >
          {sampleHand.map((card, index) => {
            const isSelected = selectedIds.includes(card.id);
            return (
              <SingleCard
                key={card.id}
                rank={card.rank}
                suit={card.suit}
                faceUp={card.faceUp}
                meta={card.meta}
                size="md"
                selected={isSelected}
                highlighted={isSelected}
                tiltDeg={(index - (sampleHand.length - 1) / 2) * 4}
                onClick={() => toggleCard(card.id)}
                onLongPress={() => setLastInteraction(`长按 ${card.id}`)}
                style={{
                  marginLeft: index === 0 ? 0 : -48
                }}
              />
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}
      >
        <CardStack
          count={37}
          topCard={sampleHand[0]}
          faceUpTop={false}
          label="牌堆"
          onDraw={() => setSeed(seed => seed + 1)}
        />
        <CardStack count={selectedIds.length} topCard={sampleHand[2]} faceUpTop label="选中" />
      </div>
      {lastInteraction && (
        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.75 }}>{lastInteraction}</p>
      )}
    </section>
  );
}
