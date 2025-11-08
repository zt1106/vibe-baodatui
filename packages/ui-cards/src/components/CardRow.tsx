'use client';

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';

import type { Card, CardSize } from '@poker/core-cards';
import { fanLayout, getCardDimensions } from '@poker/core-cards';

import { dealVariants } from '../motionVariants';
import { PlayingCard } from './PlayingCard';

export type SelectMode = 'none' | 'single' | 'multi';

export interface CardRowProps {
  cards: Card[];
  size?: CardSize;
  align?: 'left' | 'center' | 'right';
  orientation?: 'bottom' | 'top';
  maxAngle?: number;
  radius?: number;
  overlap?: number; // 0..1 ratio of overlap, higher = tighter fan
  layoutIdPrefix?: string;
  selectMode?: SelectMode;
  selectedIds?: string[];
  onSelect?: (selectedIds: string[], card: Card) => void;
  onCardClick?: (card: Card) => void;
  onCardLongPress?: (card: Card) => void;
}

const JUSTIFY_MAP = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end'
} as const;

export function CardRow({
  cards,
  size = 'md',
  align = 'center',
  orientation = 'bottom',
  maxAngle,
  radius,
  overlap = 0.35,
  layoutIdPrefix = 'card-row',
  selectMode = 'none',
  selectedIds,
  onSelect,
  onCardClick,
  onCardLongPress
}: CardRowProps) {
  const isControlled = Array.isArray(selectedIds);
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const selection = isControlled ? selectedIds! : internalSelected;
  const selectedSet = useMemo(() => new Set(selection), [selection]);
  const { width: cardWidth, height: cardHeight } = getCardDimensions(size);
  const approxRowWidth = cardWidth + Math.max(cards.length - 1, 0) * cardWidth * (1 - overlap);
  const alignOffset =
    align === 'left'
      ? -approxRowWidth / 2 + cardWidth / 2
      : align === 'right'
        ? approxRowWidth / 2 - cardWidth / 2
        : 0;

  const positions = useMemo(
    () =>
      fanLayout(cards.length, {
        maxAngle,
        radius,
        pivot: align
      }),
    [cards.length, maxAngle, radius, align]
  );

  const handleSelect = (card: Card) => {
    if (selectMode === 'none') {
      onCardClick?.(card);
      return;
    }
    const nextSet = selectMode === 'single' ? new Set<string>() : new Set(selection);
    if (selectMode === 'single') {
      if (selection.length === 1 && selection[0] === card.id) {
        nextSet.clear();
      } else {
        nextSet.clear();
        nextSet.add(card.id);
      }
    } else {
      if (nextSet.has(card.id)) {
        nextSet.delete(card.id);
      } else {
        nextSet.add(card.id);
      }
    }
    const next = Array.from(nextSet);
    if (!isControlled) {
      setInternalSelected(next);
    }
    onSelect?.(next, card);
    onCardClick?.(card);
  };

  const containerHeight = cardHeight + 80;

  const entryOffset = orientation === 'top' ? -80 : 80;

  return (
    <div
      style={{
        width: '100%',
        minHeight: containerHeight,
        position: 'relative',
        display: 'flex',
        justifyContent: JUSTIFY_MAP[align],
        alignItems: orientation === 'top' ? 'flex-start' : 'flex-end',
        padding: '1rem 0'
      }}
      aria-label="card-row"
    >
      <div style={{ position: 'relative', width: approxRowWidth, minHeight: containerHeight }}>
        {cards.map((card, index) => {
          const layout = positions[index];
          const translateY = orientation === 'top' ? -layout.y : layout.y;
          const tilt = orientation === 'top' ? -layout.rot : layout.rot;
          const leftValue = `calc(50% + ${(layout.x + alignOffset).toFixed(2)}px)`;

          return (
            <motion.div
              key={card.id}
              initial="hidden"
              animate="visible"
              custom={{ originX: 0, originY: entryOffset }}
              variants={dealVariants}
              style={{
                position: 'absolute',
                left: leftValue,
                top: `calc(50% + ${translateY.toFixed(2)}px)`,
                transform: 'translate(-50%, -50%)',
                zIndex: 100 + index,
                pointerEvents: 'auto'
              }}
            >
              <PlayingCard
                card={card}
                size={size}
                tiltDeg={tilt}
                layoutId={`${layoutIdPrefix}-${card.id}`}
                selected={selectedSet.has(card.id)}
                draggable={false}
                onClick={() => handleSelect(card)}
                onLongPress={onCardLongPress ? () => onCardLongPress(card) : undefined}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
