'use client';

import { useMemo, type CSSProperties } from 'react';

import type { CardMeta, Rank, Suit } from '@poker/core-cards';
import { makeCard } from '@poker/core-cards';
import { PlayingCard, type PlayingCardProps } from '@poker/ui-cards';

export interface SingleCardProps extends Omit<PlayingCardProps, 'card'> {
  rank: Rank;
  suit: Suit;
  faceUp?: boolean;
  meta?: CardMeta;
  contentScale?: number;
  contentOffsetX?: number;
  contentOffsetY?: number;
}

export function SingleCard({
  rank,
  suit,
  faceUp = true,
  meta,
  contentScale = 1.2,
  style,
  contentOffsetX = -0.5,
  contentOffsetY = -0.5,
  ...rest
}: SingleCardProps) {
  const card = useMemo(() => ({
    ...makeCard(rank, suit, faceUp),
    meta
  }), [rank, suit, faceUp, meta?.ownerSeat, meta?.selectable, meta?.tags?.join('|')]);

  const mergedStyle = {
    '--v-card-face-corner-size': `${0.9 * contentScale}rem`,
    '--v-card-face-symbol-size': `${2.4 * contentScale}rem`,
    '--v-card-face-left-offset': `${contentOffsetX}rem`,
    '--v-card-face-top-offset': `${contentOffsetY}rem`,
    ...style
  } as CSSProperties;

  return <PlayingCard {...rest} style={mergedStyle} card={card} />;
}
