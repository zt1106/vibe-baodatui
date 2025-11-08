import clsx from 'clsx';
import type { CSSProperties, HTMLAttributes } from 'react';

import { type Card, SUIT_SYMBOLS, SUIT_TINT } from '@poker/core-cards';

export type CardFaceVariant = 'classic' | 'minimal' | 'neon';

export interface CardFaceProps extends HTMLAttributes<HTMLDivElement> {
  card: Card;
  variant?: CardFaceVariant;
}

const FACE_VARIANTS: Record<CardFaceVariant, { foreground: string; accentFallback: string }> = {
  classic: { foreground: '#0f172a', accentFallback: '#0f172a' },
  minimal: { foreground: '#e2e8f0', accentFallback: '#f97316' },
  neon: { foreground: '#fdf4ff', accentFallback: '#a855f7' }
};

export function CardFace({ card, variant = 'classic', className, style, ...rest }: CardFaceProps) {
  const palette = FACE_VARIANTS[variant] ?? FACE_VARIANTS.classic;
  const symbol = SUIT_SYMBOLS[card.suit];
  const accentColor = SUIT_TINT[card.suit] === 'red' ? '#c81e1e' : palette.accentFallback;
  const cssVars: CSSProperties = {
    '--card-face-foreground': palette.foreground,
    '--card-face-accent': accentColor
  } as CSSProperties;

  return (
    <div
      {...rest}
      className={clsx('v-card-face', `v-card-face--${variant}`, className)}
      style={{ ...cssVars, ...style }}
    >
      <div className={clsx('v-card-face__corner', 'v-card-face__corner--top')}>
        <span className="v-card-face__rank">{card.rank}</span>
        <span className="v-card-face__suit">{symbol}</span>
      </div>
      <div className="v-card-face__pip" aria-hidden>
        {symbol}
      </div>
      <div className={clsx('v-card-face__corner', 'v-card-face__corner--bottom')}>
        <span className="v-card-face__rank">{card.rank}</span>
        <span className="v-card-face__suit">{symbol}</span>
      </div>
      {card.meta?.tags && card.meta.tags.length > 0 && (
        <div className="v-card-face__tags">
          {card.meta.tags.map(tag => (
            <span key={tag} className="v-card-face__tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
