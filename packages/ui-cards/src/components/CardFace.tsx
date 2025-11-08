import clsx from 'clsx';
import type { HTMLAttributes } from 'react';
import { type Card, SUIT_SYMBOLS, SUIT_TINT } from '@poker/core-cards';

export type CardFaceVariant = 'classic' | 'minimal' | 'outline';

export interface CardFaceProps extends HTMLAttributes<HTMLDivElement> {
  card: Card;
  variant?: CardFaceVariant;
}

const FACE_VARIANTS: Record<CardFaceVariant, { background: string; border: string; foreground: string }> = {
  classic: { background: '#f8fafc', border: '#cbd5f5', foreground: '#0f172a' },
  minimal: { background: 'rgba(15, 23, 42, 0.82)', border: 'rgba(226, 232, 240, 0.45)', foreground: '#e2e8f0' },
  outline: { background: 'transparent', border: 'rgba(148, 163, 184, 0.75)', foreground: '#e2e8f0' }
};

export function CardFace({ card, variant = 'classic', className, style, ...rest }: CardFaceProps) {
  const palette = FACE_VARIANTS[variant] ?? FACE_VARIANTS.classic;
  const accent = SUIT_TINT[card.suit] === 'red' ? '#f87171' : palette.foreground;
  const symbol = SUIT_SYMBOLS[card.suit];

  const cornerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    lineHeight: 1,
    fontSize: '0.9rem',
    letterSpacing: '0.05em'
  };

  return (
    <div
      {...rest}
      className={clsx('v-card-face', className)}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 'inherit',
        border: `2px solid ${palette.border}`,
        background: palette.background,
        color: accent,
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        padding: '0.65rem',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      <div style={{ ...cornerStyle, alignItems: 'flex-start' }}>
        <span style={{ fontWeight: 700 }}>{card.rank}</span>
        <span>{symbol}</span>
      </div>
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          fontSize: '2.4rem',
          fontWeight: 600,
          opacity: 0.9,
          color: accent
        }}
        aria-hidden
      >
        {symbol}
      </div>
      <div style={{ ...cornerStyle, alignItems: 'flex-end', transform: 'rotate(180deg)' }}>
        <span style={{ fontWeight: 700 }}>{card.rank}</span>
        <span>{symbol}</span>
      </div>
      {card.meta?.tags && card.meta.tags.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 4,
            flexWrap: 'wrap',
            fontSize: '0.55rem'
          }}
        >
          {card.meta.tags.map(tag => (
            <span
              key={tag}
              style={{
                padding: '0.1rem 0.4rem',
                borderRadius: 999,
                background: 'rgba(15, 23, 42, 0.65)',
                color: '#e2e8f0'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
