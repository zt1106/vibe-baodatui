import type { CardLayout } from './types';

export interface FanLayoutOptions {
  maxAngle?: number;
  radius?: number;
  pivot?: 'left' | 'center' | 'right';
  verticalLift?: number;
}

export function fanLayout(count: number, options: FanLayoutOptions = {}): CardLayout[] {
  if (count <= 0) return [];
  if (count === 1) {
    return [{ x: 0, y: 0, rot: 0 }];
  }
  const maxAngle = options.maxAngle ?? 22;
  const radius = options.radius ?? 420;
  const pivot = options.pivot ?? 'center';
  const verticalLift = options.verticalLift ?? 1;
  const step = count === 1 ? 0 : (maxAngle * 2) / (count - 1);
  const offsetIndex =
    pivot === 'left' ? 0 : pivot === 'right' ? count - 1 : (count - 1) / 2;

  return Array.from({ length: count }, (_, index) => {
    const angle = -maxAngle + index * step;
    const radians = (angle * Math.PI) / 180;
    const x = radius * Math.sin(radians);
    const y = radius * (1 - Math.cos(radians)) * verticalLift;
    return {
      x: x - offsetIndex * 12,
      y,
      rot: angle
    } satisfies CardLayout;
  });
}
