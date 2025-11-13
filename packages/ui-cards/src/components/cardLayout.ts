export interface LayoutInput {
  count: number;
  cardWidth: number;
  cardHeight: number;
  overlapPx: number;
  leftAngleDeg: number;
  curveVerticalOffset: number;
}

export interface CardTransform {
  x: number;
  y: number;
  rotateDeg: number;
  zIndex: number;
}

export function computeRowLayout(input: LayoutInput): CardTransform[] {
  const { count, cardWidth, overlapPx, leftAngleDeg, curveVerticalOffset } = input;
  if (count <= 0) return [];
  if (count === 1) {
    return [{
      x: 0,
      y: 0,
      rotateDeg: 0,
      zIndex: 0
    }];
  }
  const stepX = Math.max(0, cardWidth - overlapPx);
  const lastIndex = Math.max(1, count - 1);
  const verticalAmplitude = Math.max(0, curveVerticalOffset);
  const direction = leftAngleDeg === 0 ? 0 : Math.sign(leftAngleDeg);
  const edgeEmphasisPower = 2; // push offsets toward the edges so the center stays flatter

  return Array.from({ length: count }, (_, index) => {
    const t = index / lastIndex;
    const rotateDeg = leftAngleDeg * (1 - 2 * t);
    const normalizedDistance = lastIndex === 0 ? 0 : Math.abs(2 * t - 1);
    const easedCurve = 1 - Math.pow(normalizedDistance, edgeEmphasisPower);
    const offsetFactor = Math.max(0, Math.min(1, easedCurve));
    const y = offsetFactor * verticalAmplitude * direction;
    return {
      x: index * stepX,
      y,
      rotateDeg,
      zIndex: index
    };
  });
}
