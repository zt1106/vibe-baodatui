const CARD_RATIO = 1.4;
const SIZE_MAP = {
  xs: 40,
  sm: 64,
  md: 88,
  lg: 120
};
export function getCardDimensions(size = 'md') {
  const height = SIZE_MAP[size];
  return {
    height,
    width: Math.round(height / CARD_RATIO)
  };
}
export function resolveCardCssVars(size = 'md') {
  const { width, height } = getCardDimensions(size);
  return {
    '--card-w': `${width}px`,
    '--card-h': `${height}px`
  };
}
