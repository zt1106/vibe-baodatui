'use client';

import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

import type { Card, CardSize } from '@poker/core-cards';
import { getCardDimensions } from '@poker/core-cards';

import { CardBack, type CardBackVariant } from './CardBack';
import { PlayingCard } from './PlayingCard';

export interface CardStackProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  count: number;
  topCard?: Card;
  size?: CardSize;
  faceUpTop?: boolean;
  backVariant?: CardBackVariant;
  label?: string;
  onDraw?: () => void;
  disabled?: boolean;
  accessory?: ReactNode;
}

export function CardStack({
  count,
  topCard,
  size = 'md',
  faceUpTop,
  backVariant = 'red',
  label,
  onDraw,
  disabled,
  accessory,
  className,
  style,
  ...rest
}: CardStackProps) {
  const { width, height } = getCardDimensions(size);
  const visibleLayers = Math.min(Math.max(count - (topCard ? 1 : 0), 0), 3);
  const offsetStep = Math.max(2, Math.round(width * 0.05));
  const displayedTopCard = topCard
    ? {
        ...topCard,
        faceUp: faceUpTop ?? topCard.faceUp
      }
    : undefined;

  return (
    <div
      {...rest}
      className={clsx('v-card-stack', className)}
      style={{
        position: 'relative',
        width: width + offsetStep * 2,
        height: height + offsetStep * 2,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <div style={{ position: 'relative', width, height }}>
        {Array.from({ length: visibleLayers }).map((_, index) => (
          <div
            key={`back-${index}`}
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translate(${index * offsetStep}px, ${index * offsetStep}px)`,
              borderRadius: 18,
              boxShadow: '0 8px 30px rgba(15, 23, 42, 0.4)'
            }}
            aria-hidden
          >
            <CardBack variant={backVariant} />
          </div>
        ))}

        {displayedTopCard ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translate(${visibleLayers * offsetStep}px, ${visibleLayers * offsetStep}px)`
            }}
          >
            <PlayingCard card={displayedTopCard} size={size} draggable={false} layoutId={`stack-${displayedTopCard.id}`} />
          </div>
        ) : count > 0 ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translate(${visibleLayers * offsetStep}px, ${visibleLayers * offsetStep}px)`,
              borderRadius: 18,
              boxShadow: '0 12px 28px rgba(15, 23, 42, 0.35)'
            }}
          >
            <CardBack variant={backVariant} />
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 18,
              border: '2px dashed rgba(148, 163, 184, 0.4)',
              display: 'grid',
              placeItems: 'center',
              color: 'rgba(148, 163, 184, 0.7)',
              fontSize: '0.8rem'
            }}
          >
            Empty stack
          </div>
        )}

        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              fontSize: '0.75rem',
              padding: '0.15rem 0.5rem',
              borderRadius: 999,
              background: 'rgba(2, 6, 23, 0.82)',
              color: '#f8fafc',
              border: '1px solid rgba(248, 250, 252, 0.18)'
            }}
          >
            {count}
          </span>
        )}
      </div>

      {(label || onDraw || accessory) && (
        <div
          style={{
            position: 'absolute',
            bottom: -48,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8
          }}
        >
          {label && <span style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>{label}</span>}
          {onDraw && (
            <button
              onClick={disabled ? undefined : onDraw}
              disabled={disabled}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: 999,
                border: '1px solid rgba(248, 250, 252, 0.45)',
                background: disabled ? 'rgba(148, 163, 184, 0.25)' : 'rgba(30, 64, 175, 0.75)',
                color: '#f8fafc',
                fontSize: '0.75rem',
                cursor: disabled ? 'not-allowed' : 'pointer'
              }}
            >
              抽牌
            </button>
          )}
          {accessory}
        </div>
      )}
    </div>
  );
}
