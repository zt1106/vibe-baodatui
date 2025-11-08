'use client';

import clsx from 'clsx';
import {
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  useCallback,
  useMemo,
  useState
} from 'react';

import type { Card, CardSize } from '@poker/core-cards';
import { getCardDimensions } from '@poker/core-cards';

import { PlayingCard } from './PlayingCard';
import { computeRowLayout } from './cardLayout';
import type { CardRowProps, CardRowSize } from './cardRow.types';

const CARD_RATIO = 1.4;

function resolveCardDimensions(size: CardRowSize) {
  if (typeof size === 'string') {
    return getCardDimensions(size);
  }
  const height = size.height ?? Math.round(size.width * CARD_RATIO);
  return { width: size.width, height };
}

function resolveOverlapPx(overlap: CardRowProps['overlap'], cardWidth: number) {
  if (typeof overlap === 'string' && overlap.endsWith('%')) {
    const parsed = Number.parseFloat(overlap);
    if (Number.isFinite(parsed)) {
      return (Math.max(0, Math.min(parsed, 100)) / 100) * cardWidth;
    }
    return 0;
  }
  return Number.isFinite(Number(overlap)) ? Number(overlap) : 0;
}

function buildSizeStyle(size: CardRowSize): CSSProperties | undefined {
  if (typeof size === 'string') {
    return undefined;
  }
  const height = size.height ?? Math.round(size.width * CARD_RATIO);
  return {
    '--card-w': `${size.width}px`,
    '--card-h': `${height}px`
  } as CSSProperties;
}

export function CardRow({
  cards,
  size = 'md',
  overlap = '30%',
  angle = 0,
  curveVerticalOffset = 0,
  selectionMode = 'none',
  selectedIds,
  defaultSelectedIds,
  onSelectionChange,
  disabledIds = [],
  onCardClick,
  className,
  style,
  ...rest
}: CardRowProps) {
  const cardSize = useMemo(() => resolveCardDimensions(size), [size]);
  const customSizeStyle = useMemo(() => buildSizeStyle(size), [size]);
  const resolvedOverlap = useMemo(
    () => Math.min(Math.max(resolveOverlapPx(overlap, cardSize.width), 0), cardSize.width),
    [cardSize.width, overlap]
  );
  const clampedAngle = Math.max(-45, Math.min(angle, 45));
  const layout = useMemo(
    () =>
      computeRowLayout({
        count: cards.length,
        cardWidth: cardSize.width,
        cardHeight: cardSize.height,
        overlapPx: resolvedOverlap,
        leftAngleDeg: clampedAngle,
        curveVerticalOffset
      }),
    [cards.length, cardSize.width, cardSize.height, resolvedOverlap, clampedAngle, curveVerticalOffset]
  );

  const [internalSelection, setInternalSelection] = useState<string[]>(defaultSelectedIds ?? []);
  const selection = selectedIds ?? internalSelection;
  const setSelection = useCallback(
    (next: string[]) => {
      if (selectedIds === undefined) {
        setInternalSelection(next);
      }
      onSelectionChange?.(next);
    },
    [onSelectionChange, selectedIds]
  );

  const disabledSet = useMemo(() => new Set(disabledIds), [disabledIds]);
  const isDisabled = useCallback((id: string) => disabledSet.has(id), [disabledSet]);

  const handleClick = useCallback(
    (card: Card, event: MouseEvent<HTMLDivElement>) => {
      if (isDisabled(card.id)) {
        return;
      }
      onCardClick?.(card);
      if (selectionMode === 'none') {
        return;
      }
      const already = selection.includes(card.id);
      if (selectionMode === 'single') {
        if (already) {
          setSelection([]);
          return;
        }
        setSelection([card.id]);
        return;
      }
      const meta = event.metaKey || event.ctrlKey;
      if (meta) {
        setSelection(already ? selection.filter(id => id !== card.id) : [...selection, card.id]);
        return;
      }
      setSelection(already ? [] : [card.id]);
    },
    [isDisabled, onCardClick, selection, selectionMode, setSelection]
  );

  const spacing = Math.max(0, cardSize.width - resolvedOverlap);
  const totalWidth = cards.length === 0 ? cardSize.width : cardSize.width + (cards.length - 1) * spacing;

  const ariaProps =
    selectionMode === 'none'
      ? { role: 'list', 'aria-label': 'Card row' }
      : {
          role: 'listbox',
          'aria-multiselectable': selectionMode === 'multiple' || undefined,
          'aria-label': 'Card row'
        };

  const containerClassName = clsx('v-card-row', className);

  return (
    <div
      {...rest}
      className={containerClassName}
      style={{
        position: 'relative',
        height: cardSize.height,
        width: totalWidth,
        ...style
      }}
      {...ariaProps}
    >
      {cards.map((card, index) => {
        const transform = layout[index] ?? { x: 0, y: 0, rotateDeg: 0, zIndex: index };
        const isSelected = selection.includes(card.id);
        const transformParts = [
          `translate(${transform.x}px, ${transform.y}px)`,
          `rotate(${transform.rotateDeg}deg)`
        ];
        if (isSelected) {
          transformParts.push('translateY(-6px)', 'scale(1.04)');
        }
        return (
          <div
            key={card.id}
            data-card-id={card.id}
            role={selectionMode === 'none' ? 'listitem' : 'option'}
            aria-selected={selectionMode === 'none' ? undefined : isSelected}
            onClick={event => handleClick(card, event)}
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              transformOrigin: 'bottom center',
              transform: transformParts.join(' '),
              zIndex: transform.zIndex,
              transition: 'transform 150ms ease, filter 150ms ease',
              cursor:
                isDisabled(card.id) || selectionMode === 'none'
                  ? isDisabled(card.id)
                    ? 'not-allowed'
                    : 'default'
                  : 'pointer',
              filter: isDisabled(card.id) ? 'grayscale(0.4) opacity(0.65)' : undefined
            }}
          >
            <PlayingCard
              card={card}
              size={typeof size === 'string' ? size : 'md'}
              selected={isSelected}
              highlighted={isSelected}
              disabled={isDisabled(card.id)}
              style={customSizeStyle}
            />
          </div>
        );
      })}
    </div>
  );
}
