import type { GameCard } from '@shared/messages';

import type { Combo, RankValue } from './types';
import { ComboType, isBigJoker, isSmallJoker, rankValue, sortCardsByRank } from './types';

type RankCounts = Map<RankValue, number>;

function buildRankCounts(cards: GameCard[]): RankCounts {
  const counts: RankCounts = new Map();
  for (const card of cards) {
    const value = rankValue(card);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function hasDuplicateIds(cards: GameCard[]): boolean {
  const ids = new Set<number>();
  for (const card of cards) {
    if (ids.has(card.id)) {
      return true;
    }
    ids.add(card.id);
  }
  return false;
}

function ranksAreConsecutive(ranks: RankValue[]): boolean {
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] !== (ranks[i - 1] + 1)) {
      return false;
    }
  }
  return true;
}

function maxRank(ranks: RankValue[]): RankValue {
  return ranks[ranks.length - 1];
}

function isRocket(cards: GameCard[]) {
  if (cards.length !== 2) return false;
  const [a, b] = cards;
  return (
    a.rank === 'Joker' &&
    b.rank === 'Joker' &&
    ((isSmallJoker(a) && isBigJoker(b)) || (isSmallJoker(b) && isBigJoker(a)))
  );
}

function pairRank(counts: RankCounts): RankValue | null {
  if (counts.size !== 1) return null;
  const [[rank, count]] = counts.entries();
  if (count === 2) return rank;
  return null;
}

function tripleRank(counts: RankCounts): RankValue | null {
  if (counts.size !== 1) return null;
  const [[rank, count]] = counts.entries();
  if (count === 3) return rank;
  return null;
}

function bombRank(counts: RankCounts): RankValue | null {
  if (counts.size !== 1) return null;
  const [[rank, count]] = counts.entries();
  if (count === 4) return rank;
  return null;
}

function tripleWithSingle(counts: RankCounts): RankValue | null {
  if (counts.size !== 2) return null;
  const entries = Array.from(counts.entries());
  const triple = entries.find(([, count]) => count === 3)?.[0];
  const single = entries.find(([, count]) => count === 1)?.[0];
  if (triple && single && triple !== single) {
    return triple;
  }
  return null;
}

function tripleWithPair(counts: RankCounts): RankValue | null {
  if (counts.size !== 2) return null;
  const entries = Array.from(counts.entries());
  const triple = entries.find(([, count]) => count === 3)?.[0];
  const pair = entries.find(([, count]) => count === 2)?.[0];
  if (triple && pair && triple !== pair) {
    return triple;
  }
  return null;
}

function isSequence(counts: RankCounts, totalCards: number): { mainRank: RankValue; length: number } | null {
  if (totalCards < 5) return null;
  const entries = Array.from(counts.entries());
  if (entries.some(([, count]) => count !== 1)) return null;
  const ranks = entries.map(([rank]) => rank).sort((a, b) => a - b);
  if (ranks.length !== totalCards) return null;
  if (ranks.some(rank => rank >= 15)) return null; // excludes 2 and jokers
  if (!ranksAreConsecutive(ranks)) return null;
  return { mainRank: maxRank(ranks), length: totalCards };
}

function isSequenceOfPairs(counts: RankCounts, totalCards: number): { mainRank: RankValue; length: number } | null {
  if (totalCards < 6 || totalCards % 2 !== 0) return null;
  const entries = Array.from(counts.entries());
  if (entries.some(([, count]) => count !== 2)) return null;
  const ranks = entries.map(([rank]) => rank).sort((a, b) => a - b);
  if (ranks.length !== totalCards / 2) return null;
  if (ranks.some(rank => rank >= 15)) return null;
  if (!ranksAreConsecutive(ranks)) return null;
  return { mainRank: maxRank(ranks), length: ranks.length };
}

function isPlane(counts: RankCounts, totalCards: number): { mainRank: RankValue; length: number } | null {
  if (totalCards < 6 || totalCards % 3 !== 0) return null;
  const entries = Array.from(counts.entries());
  if (entries.some(([, count]) => count !== 3)) return null;
  const ranks = entries.map(([rank]) => rank).sort((a, b) => a - b);
  if (ranks.length !== totalCards / 3) return null;
  if (ranks.length < 2) return null;
  if (ranks.some(rank => rank >= 15)) return null;
  if (!ranksAreConsecutive(ranks)) return null;
  return { mainRank: maxRank(ranks), length: ranks.length };
}

function resolvePlaneWithAttachments(
  counts: RankCounts,
  totalCards: number,
  attachmentSize: 1 | 2
): { mainRank: RankValue; length: number } | null {
  const k = totalCards / (3 + attachmentSize);
  if (!Number.isInteger(k) || k < 2) return null;

  const candidateTripRanks = Array.from(counts.entries())
    .filter(([rank, count]) => count >= 3 && rank < 15)
    .map(([rank]) => rank)
    .sort((a, b) => a - b);

  let bestTripRanks: RankValue[] | null = null;

  for (let i = 0; i <= candidateTripRanks.length - k; i++) {
    const tripRanks = candidateTripRanks.slice(i, i + k);
    if (!ranksAreConsecutive(tripRanks)) continue;

    const remainder = new Map(counts);
    let valid = true;
    for (const rank of tripRanks) {
      const next = (remainder.get(rank) ?? 0) - 3;
      if (next !== 0) {
        valid = false;
        break;
      }
      remainder.set(rank, next);
    }
    if (!valid) continue;

    for (const [rank, count] of Array.from(remainder.entries())) {
      if (count === 0) {
        remainder.delete(rank);
      }
    }

    const remainingCards = Array.from(remainder.values()).reduce((sum, count) => sum + count, 0);
    if (remainingCards !== k * attachmentSize) continue;

    if (attachmentSize === 1) {
      if (remainder.size !== k) continue;
      if (Array.from(remainder.values()).some(count => count !== 1)) continue;
    } else {
      if (remainder.size !== k) continue;
      if (Array.from(remainder.values()).some(count => count !== 2)) continue;
    }

    if (!bestTripRanks || maxRank(tripRanks) > maxRank(bestTripRanks)) {
      bestTripRanks = tripRanks;
    }
  }

  if (!bestTripRanks) return null;
  return { mainRank: maxRank(bestTripRanks), length: bestTripRanks.length };
}

function fourWithTwoSingles(counts: RankCounts): RankValue | null {
  if (counts.size !== 3) return null;
  const quad = Array.from(counts.entries()).find(([, count]) => count === 4)?.[0];
  if (!quad) return null;
  const singles = Array.from(counts.entries()).filter(([, count]) => count === 1);
  if (singles.length !== 2) return null;
  return quad;
}

function fourWithTwoPairs(counts: RankCounts): RankValue | null {
  if (counts.size !== 3) return null;
  const quad = Array.from(counts.entries()).find(([, count]) => count === 4)?.[0];
  if (!quad) return null;
  const pairs = Array.from(counts.entries()).filter(([, count]) => count === 2);
  if (pairs.length !== 2) return null;
  return quad;
}

export function classifyCombo(cards: GameCard[]): Combo | null {
  if (cards.length === 0) {
    return { type: ComboType.PASS, cards: [] };
  }
  if (hasDuplicateIds(cards)) {
    return null;
  }
  const sorted = sortCardsByRank(cards);
  const counts = buildRankCounts(sorted);

  if (isRocket(sorted)) {
    return { type: ComboType.ROCKET, cards: sorted, mainRank: 17, length: 1 };
  }

  if (sorted.length === 1) {
    return { type: ComboType.SINGLE, mainRank: rankValue(sorted[0]), cards: sorted };
  }

  if (sorted.length === 2) {
    const pr = pairRank(counts);
    if (pr) {
      return { type: ComboType.PAIR, mainRank: pr, cards: sorted };
    }
  }

  if (sorted.length === 3) {
    const tr = tripleRank(counts);
    if (tr) {
      return { type: ComboType.TRIPLE, mainRank: tr, cards: sorted };
    }
  }

  if (sorted.length === 4) {
    const bomb = bombRank(counts);
    if (bomb) {
      return { type: ComboType.BOMB, mainRank: bomb, cards: sorted };
    }
    const trWithSingle = tripleWithSingle(counts);
    if (trWithSingle) {
      return { type: ComboType.TRIPLE_WITH_SINGLE, mainRank: trWithSingle, cards: sorted };
    }
  }

  if (sorted.length === 5) {
    const trWithPair = tripleWithPair(counts);
    if (trWithPair) {
      return { type: ComboType.TRIPLE_WITH_PAIR, mainRank: trWithPair, cards: sorted };
    }
  }

  const straight = isSequence(counts, sorted.length);
  if (straight) {
    return { type: ComboType.SEQUENCE, mainRank: straight.mainRank, length: straight.length, cards: sorted };
  }

  const pairStraight = isSequenceOfPairs(counts, sorted.length);
  if (pairStraight) {
    return {
      type: ComboType.SEQUENCE_OF_PAIRS,
      mainRank: pairStraight.mainRank,
      length: pairStraight.length,
      cards: sorted
    };
  }

  const plane = isPlane(counts, sorted.length);
  if (plane) {
    return { type: ComboType.PLANE, mainRank: plane.mainRank, length: plane.length, cards: sorted };
  }

  const planeSingles = resolvePlaneWithAttachments(counts, sorted.length, 1);
  if (planeSingles) {
    return {
      type: ComboType.PLANE_WITH_SINGLES,
      mainRank: planeSingles.mainRank,
      length: planeSingles.length,
      cards: sorted
    };
  }

  const planePairs = resolvePlaneWithAttachments(counts, sorted.length, 2);
  if (planePairs) {
    return {
      type: ComboType.PLANE_WITH_PAIRS,
      mainRank: planePairs.mainRank,
      length: planePairs.length,
      cards: sorted
    };
  }

  if (sorted.length === 6) {
    const quadSingles = fourWithTwoSingles(counts);
    if (quadSingles) {
      return { type: ComboType.FOUR_WITH_TWO_SINGLES, mainRank: quadSingles, cards: sorted };
    }
  }

  if (sorted.length === 8) {
    const quadPairs = fourWithTwoPairs(counts);
    if (quadPairs) {
      return { type: ComboType.FOUR_WITH_TWO_PAIRS, mainRank: quadPairs, cards: sorted };
    }
  }

  return null;
}

export function beats(curr: Combo, prev: Combo | null): boolean {
  if (!prev) {
    return curr.type !== ComboType.PASS;
  }
  if (curr.type === ComboType.PASS) {
    return false;
  }
  if (curr.type === ComboType.ROCKET) {
    return prev.type !== ComboType.ROCKET;
  }
  if (prev.type === ComboType.ROCKET) {
    return false;
  }
  if (curr.type === ComboType.BOMB) {
    if (prev.type !== ComboType.BOMB) return true;
    return (curr.mainRank ?? 0) > (prev.mainRank ?? 0);
  }
  if (prev.type === ComboType.BOMB) {
    return false;
  }
  if (curr.type !== prev.type) {
    return false;
  }
  if (prev.length !== undefined && curr.length !== prev.length) {
    return false;
  }
  return (curr.mainRank ?? 0) > (prev.mainRank ?? 0);
}
