'use client';

import type { Card } from '@poker/core-cards';

export interface CardMetaAnimationDirectives {
  flip: boolean;
  bounce: boolean;
}

// Mapping of meta tags -> animation directives (card-animation-plan §3.2).
const FLIP_TAGS = new Set(['flip', 'flip-on-reveal', 'flip-on-draw']);
const BOUNCE_TAGS = new Set(['bounce', 'pop', 'punch', 'springy']);

export function resolveCardMetaAnimation(card?: Card | null): CardMetaAnimationDirectives {
  const tags = card?.meta?.tags;
  if (!tags?.length) {
    return { flip: false, bounce: false };
  }
  const normalized = tags.map(tag => tag.toLowerCase());
  const flip = normalized.some(tag => FLIP_TAGS.has(tag));
  const bounce = normalized.some(tag => BOUNCE_TAGS.has(tag));
  return { flip, bounce };
}
