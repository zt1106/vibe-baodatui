import type { CardSize } from './types';

const CARD_RATIO = 1.4;

const SIZE_MAP: Record<CardSize, number> = {
  xs: 40,
  sm: 64,
  md: 88,
  lg: 120
};

export interface CardDimensions {
  width: number;
  height: number;
}

export function getCardDimensions(size: CardSize = 'md'): CardDimensions {
  const height = SIZE_MAP[size];
  return {
    height,
    width: Math.round(height / CARD_RATIO)
  };
}

export function resolveCardCssVars(size: CardSize = 'md'): Record<string, string> {
  const { width, height } = getCardDimensions(size);
  return {
    '--card-w': `${width}px`,
    '--card-h': `${height}px`
  };
}
