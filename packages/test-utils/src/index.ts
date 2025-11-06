
export function nextSeed(prefix = 'hand'): string {
  return `${prefix}-${Date.now()}`;
}
