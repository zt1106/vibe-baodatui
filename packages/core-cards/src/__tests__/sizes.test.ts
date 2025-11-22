import { describe, expect, it } from 'vitest';
import { getCardDimensions, resolveCardCssVars } from '../sizes';

const SIZE_HEIGHTS = {
  xs: 40,
  sm: 64,
  md: 88,
  lg: 120
} as const;

describe('sizes', () => {
  it('computes width/height ratios for each preset', () => {
    for (const [size, height] of Object.entries(SIZE_HEIGHTS)) {
      const dims = getCardDimensions(size as keyof typeof SIZE_HEIGHTS);
      expect(dims.height).toBe(height);
      expect(dims.width).toBe(Math.round(height / 1.4));
    }
  });

  it('exposes css variable strings for a size', () => {
    const vars = resolveCardCssVars('sm');
    expect(vars['--card-h']).toBe(`${SIZE_HEIGHTS.sm}px`);
    expect(vars['--card-w']).toBe(`${Math.round(SIZE_HEIGHTS.sm / 1.4)}px`);
  });
});
