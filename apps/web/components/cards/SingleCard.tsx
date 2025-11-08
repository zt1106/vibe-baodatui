'use client';

import { useMemo } from 'react';

import type { CardMeta, Rank, Suit } from '@poker/core-cards';
import { makeCard } from '@poker/core-cards';
import { PlayingCard, type PlayingCardProps } from '@poker/ui-cards';

export interface SingleCardProps extends Omit<PlayingCardProps, 'card'> {
  rank: Rank;
  suit: Suit;
  faceUp?: boolean;
  meta?: CardMeta;
}

export function SingleCard({
  rank,
  suit,
  faceUp = true,
  meta,
  style,
  ...rest
}: SingleCardProps) {
  const card = useMemo(() => ({
    ...makeCard(rank, suit, faceUp),
    meta
  }), [rank, suit, faceUp, meta?.ownerSeat, meta?.selectable, meta?.tags?.join('|')]);

  return <PlayingCard {...rest} style={style} card={card} />;
}
