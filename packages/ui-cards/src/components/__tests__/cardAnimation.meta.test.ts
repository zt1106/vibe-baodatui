import { describe, expect, it } from 'vitest';
import { resolveCardMetaAnimation } from '../cardAnimation.meta';

const baseCard = { id: 1, rank: 'A', suit: 'S', faceUp: true } as const;

describe('resolveCardMetaAnimation', () => {
  it('returns no directives when card has no tags', () => {
    expect(resolveCardMetaAnimation(null)).toEqual({ flip: false, bounce: false });
    expect(resolveCardMetaAnimation({ ...baseCard })).toEqual({ flip: false, bounce: false });
  });

  it('normalizes tags to map flip directives', () => {
    const card = { ...baseCard, meta: { tags: ['FLIP', 'other'] } };
    expect(resolveCardMetaAnimation(card)).toEqual({ flip: true, bounce: false });
  });

  it('enables bounce for supported tags', () => {
    const card = { ...baseCard, meta: { tags: ['Pop', 'punch'] } };
    expect(resolveCardMetaAnimation(card)).toEqual({ flip: false, bounce: true });
  });

  it('supports both flip and bounce simultaneously', () => {
    const card = { ...baseCard, meta: { tags: ['flip-on-draw', 'bounce'] } };
    expect(resolveCardMetaAnimation(card)).toEqual({ flip: true, bounce: true });
  });
});
