export * from './socket';
export * from './deck';
export * from './fixtures';

export function nextSeed(prefix = 'hand'): string {
  return `${prefix}-${Date.now()}`;
}
