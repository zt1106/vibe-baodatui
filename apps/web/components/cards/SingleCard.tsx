'use client';

import { useMemo } from 'react';

import type { CardId, CardMeta } from '@poker/core-cards';
import { parseCardId } from '@poker/core-cards';
import { PlayingCard, type PlayingCardProps } from '@poker/ui-cards';

export interface SingleCardProps extends Omit<PlayingCardProps, 'card'> {
  cardId: CardId;
  faceUp?: boolean;
  meta?: CardMeta;
  cornerRadius?: number;
}

export function SingleCard({
  cardId,
  faceUp = true,
  meta,
  style,
  cornerRadius,
  ...rest
}: SingleCardProps) {
  const card = useMemo(() => {
    const parsed = parseCardId(cardId);
    if (!parsed) {
      throw new RangeError(`Invalid card id: ${cardId}`);
    }
    return {
      id: cardId,
      rank: parsed.rank,
      suit: parsed.suit,
      faceUp,
      meta
    };
  }, [cardId, faceUp, meta]);

  return <PlayingCard {...rest} style={style} card={card} cornerRadius={cornerRadius} />;
}
