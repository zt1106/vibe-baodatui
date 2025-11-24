import clsx from 'clsx';
import type { HTMLAttributes } from 'react';
import { type Card, SUIT_SYMBOLS, SUIT_TINT } from '@poker/core-cards';

import { JokerIcon } from './JokerIcon';

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
  const isJoker = card.rank === 'Joker';
  const jokerTone = card.suit === 'JR' ? 'red' : 'black';
  const accent = isJoker ? (jokerTone === 'red' ? '#f87171' : '#38bdf8') : SUIT_TINT[card.suit] === 'red' ? '#f87171' : palette.foreground;
  const symbol = isJoker ? null : SUIT_SYMBOLS[card.suit];

  const cornerBaseStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    lineHeight: 1,
    letterSpacing: '0.05em'
  };
  const cornerTextStyle = {
    fontWeight: 700,
    fontSize: 'var(--v-card-face-corner-size, 0.9rem)'
  };
  const cornerSuitStyle = {
    fontSize: 'var(--v-card-face-corner-size, 0.9rem)'
  };
  const centerSymbolStyle = {
    display: 'grid',
    placeItems: 'center',
    fontSize: 'var(--v-card-face-symbol-size, 2.4rem)',
    fontWeight: 600,
    opacity: 0.9,
    color: accent
  };
  const topCornerStyle = {
    ...cornerBaseStyle,
    alignItems: 'flex-start',
    marginTop: 'var(--v-card-face-top-offset, 0)',
    marginLeft: 'var(--v-card-face-left-offset, 0)'
  };
  const bottomCornerStyle = {
    ...cornerBaseStyle,
    alignItems: 'flex-end',
    transform: 'rotate(180deg)',
    marginBottom: 'var(--v-card-face-top-offset, 0)',
    marginRight: 'var(--v-card-face-left-offset, 0)'
  };

  const topCornerLetters = ['J', 'O', 'K', 'E', 'R'];
  const renderTopCornerContent = () => {
    if (isJoker) {
      return (
        <>
          {topCornerLetters.map(letter => (
            <span
              key={letter}
              style={{
                ...cornerTextStyle,
                lineHeight: 0.9,
                marginBottom: 0,
                color: jokerTone === 'black' ? '#0f172a' : accent
              }}
            >
              {letter}
            </span>
          ))}
        </>
      );
    }
    return (
      <>
        <span style={cornerTextStyle}>{card.rank}</span>
        <span style={cornerSuitStyle}>{symbol}</span>
      </>
    );
  };

  const renderCornerContent = () => {
    if (isJoker) {
      return <JokerIcon tone={jokerTone} size={28} />;
    }
    return (
      <>
        <span style={cornerTextStyle}>{card.rank}</span>
        <span style={cornerSuitStyle}>{symbol}</span>
      </>
    );
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
        userSelect: 'none',
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        padding: 'var(--v-card-face-padding, 0.65rem)',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      <div style={topCornerStyle}>{renderTopCornerContent()}</div>
      <div style={centerSymbolStyle} aria-hidden>
        {isJoker ? <JokerIcon tone={jokerTone} size={56} /> : symbol}
      </div>
      <div style={bottomCornerStyle}>{renderCornerContent()}</div>
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
