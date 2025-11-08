import { describe, expect, it } from 'vitest';
import { fanLayout } from '../layout';

describe('fanLayout', () => {
  it('returns empty array for non-positive counts', () => {
    expect(fanLayout(0)).toEqual([]);
    expect(fanLayout(-3)).toEqual([]);
  });

  it('places a single card at origin', () => {
    expect(fanLayout(1)[0]).toMatchObject({ x: 0, y: 0, rot: 0 });
  });

  it('creates symmetric layout for 5 cards with default settings', () => {
    const layout = fanLayout(5);
    expect(layout).toHaveLength(5);
    expect(layout[0].rot).toBeCloseTo(-22);
    expect(layout[4].rot).toBeCloseTo(22);
    expect(layout[0].y).toBeCloseTo(layout[4].y, 3);
    expect(layout[2].x).toBeCloseTo(layout[2].x, 3);
    expect(layout[2].rot).toBe(0);
  });

  it('respects pivot option', () => {
    const center = fanLayout(3, { pivot: 'center' }).map(card => card.x);
    const left = fanLayout(3, { pivot: 'left' }).map(card => card.x);
    expect(center[0]).not.toBeCloseTo(left[0]);
  });
});
