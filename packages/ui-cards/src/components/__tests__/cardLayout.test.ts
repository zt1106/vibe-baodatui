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
        leftAngleDeg: 10,
        curveVerticalOffset: 0
      })
    ).toEqual([]);
  });

  it('spaces cards with decreasing angles and increasing z-index', () => {
    const layout = computeRowLayout({
      count: 5,
      cardWidth: 100,
      cardHeight: 140,
      overlapPx: 30,
      leftAngleDeg: 10,
      curveVerticalOffset: 12
    });

    expect(layout).toHaveLength(5);
    expect(layout[0].x).toBe(0);
    expect(layout[1].x).toBe(70);
    expect(layout[4].x).toBe(280);

    const rotateDegrees = layout.map(entry => Number(entry.rotateDeg.toFixed(2)));
    expect(rotateDegrees).toEqual([10, 5, 0, -5, -10]);
    const verticalOffsets = layout.map(entry => Number(entry.y.toFixed(2)));
    expect(verticalOffsets).toEqual([0, 9, 12, 9, 0]);
    expect(layout.map(entry => entry.zIndex)).toEqual([0, 1, 2, 3, 4]);
  });

  it('keeps a lone card upright with no offset', () => {
    const layout = computeRowLayout({
      count: 1,
      cardWidth: 100,
      cardHeight: 140,
      overlapPx: 20,
      leftAngleDeg: 30,
      curveVerticalOffset: 24
    });

    expect(layout).toEqual([{ x: 0, y: 0, rotateDeg: 0, zIndex: 0 }]);
  });
});
