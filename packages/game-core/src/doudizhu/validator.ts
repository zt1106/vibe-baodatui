import type { GameCard } from '@shared/messages';

import { beats, classifyCombo } from './combo';
import type { Combo } from './types';
import { ComboType } from './types';

export interface ComboMatcher {
  type: ComboType;
  match(cards: GameCard[]): Combo | null;
}

/**
 * Matcher builder that reuses the shared classifier but constrains the result to a specific type.
 * Useful when iterating through a list of matchers to find the first legal combo type.
 */
export function createTypeMatcher(type: ComboType): ComboMatcher {
  return {
    type,
    match(cards) {
      const combo = classifyCombo(cards);
      return combo?.type === type ? combo : null;
    }
  };
}

const ORDERED_MATCH_TYPES: ComboType[] = [
  ComboType.ROCKET,
  ComboType.BOMB,
  ComboType.FOUR_WITH_TWO_PAIRS,
  ComboType.FOUR_WITH_TWO_SINGLES,
  ComboType.PLANE_WITH_PAIRS,
  ComboType.PLANE_WITH_SINGLES,
  ComboType.PLANE,
  ComboType.SEQUENCE_OF_PAIRS,
  ComboType.SEQUENCE,
  ComboType.TRIPLE_WITH_PAIR,
  ComboType.TRIPLE_WITH_SINGLE,
  ComboType.TRIPLE,
  ComboType.PAIR,
  ComboType.SINGLE
];

export const defaultComboMatchers: ComboMatcher[] = ORDERED_MATCH_TYPES.map(createTypeMatcher);

export interface ValidationResult {
  ok: boolean;
  combo?: Combo;
  reason?: string;
}

export interface PlayValidator {
  matchers: ComboMatcher[];
  classify(cards: GameCard[]): Combo | null;
  validateLead(cards: GameCard[]): ValidationResult;
  validateFollow(cards: GameCard[], prev: Combo): ValidationResult;
}

export function createPlayValidator(matchers: ComboMatcher[] = defaultComboMatchers): PlayValidator {
  const classify = (cards: GameCard[]) => {
    for (const matcher of matchers) {
      const combo = matcher.match(cards);
      if (combo) return combo;
    }
    return null;
  };

  const validateLead = (cards: GameCard[]): ValidationResult => {
    if (cards.length === 0) {
      return { ok: false, reason: 'pass-not-allowed-when-leading' };
    }
    const combo = classify(cards);
    if (!combo) {
      return { ok: false, reason: 'invalid-combo' };
    }
    return { ok: true, combo };
  };

  const validateFollow = (cards: GameCard[], prev: Combo): ValidationResult => {
    if (cards.length === 0) {
      return { ok: true, combo: { type: ComboType.PASS, cards: [] } };
    }
    const combo = classify(cards);
    if (!combo) {
      return { ok: false, reason: 'invalid-combo' };
    }
    if (!beats(combo, prev)) {
      return { ok: false, reason: 'does-not-beat' };
    }
    return { ok: true, combo };
  };

  return {
    matchers,
    classify,
    validateLead,
    validateFollow
  };
}
