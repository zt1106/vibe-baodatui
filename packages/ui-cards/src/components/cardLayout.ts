export interface LayoutInput {
  count: number;
  cardWidth: number;
  cardHeight: number;
  overlapPx: number;
  leftAngleDeg: number;
}

export interface CardTransform {
  x: number;
  y: number;
  rotateDeg: number;
  zIndex: number;
}

export function computeRowLayout(input: LayoutInput): CardTransform[] {
  const { count, cardWidth, overlapPx, leftAngleDeg } = input;
  if (count <= 0) return [];
  const stepX = Math.max(0, cardWidth - overlapPx);
  const lastIndex = Math.max(1, count - 1);

  return Array.from({ length: count }, (_, index) => {
    const t = index / lastIndex;
    const rotateDeg = leftAngleDeg * (1 - 2 * t);
    return {
      x: index * stepX,
      y: 0,
      rotateDeg,
      zIndex: index
    };
  });
}
