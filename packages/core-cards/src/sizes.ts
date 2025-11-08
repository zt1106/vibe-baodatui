import type { CardSize } from './types';

const CARD_RATIO = 89 / 64; // classic poker aspect ratio (~1.39)

interface SizeToken {
  width: number;
  radius: number;
  inset: number;
}

const SIZE_MAP: Record<CardSize, SizeToken> = {
  xs: { width: 96, radius: 8, inset: 6 },
  sm: { width: 128, radius: 10, inset: 8 },
  md: { width: 160, radius: 12, inset: 10 },
  lg: { width: 200, radius: 14, inset: 12 }
};

export interface CardDimensions {
  width: number;
  height: number;
}

export function getCardDimensions(size: CardSize = 'md'): CardDimensions {
  const { width } = SIZE_MAP[size];
  const height = Math.round(width * CARD_RATIO);
  return {
    width,
    height
  };
}

export function resolveCardCssVars(size: CardSize = 'md'): Record<string, string> {
  const { width, height } = getCardDimensions(size);
  const { radius, inset } = SIZE_MAP[size];
  return {
    '--card-w': `${width}px`,
    '--card-h': `${height}px`,
    '--card-radius': `${radius}px`,
    '--card-inset': `${inset}px`
  };
}
