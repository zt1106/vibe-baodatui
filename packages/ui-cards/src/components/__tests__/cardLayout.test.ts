import { describe, expect, it } from 'vitest';

import { computeRowLayout } from '../cardLayout';

describe('computeRowLayout', () => {
  it('returns empty transforms for zero cards', () => {
    expect(
      computeRowLayout({
        count: 0,
        cardWidth: 100,
        cardHeight: 140,
        overlapPx: 20,
        leftAngleDeg: 10
      })
    ).toEqual([]);
  });

  it('spaces cards with decreasing angles and increasing z-index', () => {
    const layout = computeRowLayout({
      count: 5,
      cardWidth: 100,
      cardHeight: 140,
      overlapPx: 30,
      leftAngleDeg: 10
    });

    expect(layout).toHaveLength(5);
    expect(layout[0].x).toBe(0);
    expect(layout[1].x).toBe(70);
    expect(layout[4].x).toBe(280);

    const rotateDegrees = layout.map(entry => Number(entry.rotateDeg.toFixed(2)));
    expect(rotateDegrees).toEqual([10, 5, 0, -5, -10]);
    expect(layout.map(entry => entry.zIndex)).toEqual([0, 1, 2, 3, 4]);
  });
});
