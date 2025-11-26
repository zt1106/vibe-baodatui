import { describe, expect, it } from 'vitest';

import { makeCard } from '@core-cards/ids';
import { ComboType, classifyCombo, beats } from '../doudizhu';

const c = (rank: Parameters<typeof makeCard>[0], suit: Parameters<typeof makeCard>[1]) => makeCard(rank, suit);

const triple = (rank: Parameters<typeof makeCard>[0]) => [c(rank, 'S'), c(rank, 'H'), c(rank, 'D')];
const quad = (rank: Parameters<typeof makeCard>[0]) => [c(rank, 'S'), c(rank, 'H'), c(rank, 'D'), c(rank, 'C')];

describe('Dou Dizhu combo edge cases', () => {
  describe('duplicate card detection', () => {
    it('rejects combos with duplicate card IDs', () => {
      const card = c('3', 'S');
      expect(classifyCombo([card, card])).toBeNull();
      
      const threeS = c('3', 'S');
      expect(classifyCombo([threeS, threeS, threeS])).toBeNull();
    });

    it('allows same rank but different suits', () => {
      const combo = classifyCombo([c('5', 'S'), c('5', 'H')]);
      expect(combo).not.toBeNull();
      expect(combo?.type).toBe(ComboType.PAIR);
    });
  });

  describe('sequence boundary cases', () => {
    it('rejects sequences containing rank 2', () => {
      // 2 is not allowed in sequences
      expect(classifyCombo([c('10', 'S'), c('J', 'S'), c('Q', 'S'), c('K', 'S'), c('2', 'S')])).toBeNull();
      expect(classifyCombo([c('A', 'S'), c('2', 'S')])).toBeNull();
    });

    it('rejects sequences containing jokers', () => {
      expect(classifyCombo([c('Q', 'S'), c('K', 'S'), c('A', 'S'), c('Joker', 'JB')])).toBeNull();
    });

    it('accepts minimum sequence length of 5', () => {
      const seq = classifyCombo([c('3', 'S'), c('4', 'H'), c('5', 'D'), c('6', 'C'), c('7', 'S')]);
      expect(seq).not.toBeNull();
      expect(seq?.type).toBe(ComboType.SEQUENCE);
      expect(seq?.length).toBe(5);
    });

    it('rejects sequences shorter than 5', () => {
      expect(classifyCombo([c('3', 'S'), c('4', 'H'), c('5', 'D'), c('6', 'C')])).toBeNull();
    });

    it('accepts long sequences up to rank A', () => {
      const longSeq = classifyCombo([
        c('3', 'S'), c('4', 'H'), c('5', 'D'), c('6', 'C'), c('7', 'S'),
        c('8', 'H'), c('9', 'D'), c('10', 'C'), c('J', 'S'), c('Q', 'H'),
        c('K', 'D'), c('A', 'C')
      ]);
      expect(longSeq).not.toBeNull();
      expect(longSeq?.type).toBe(ComboType.SEQUENCE);
      expect(longSeq?.length).toBe(12);
    });

    it('rejects non-consecutive sequences', () => {
      expect(classifyCombo([c('3', 'S'), c('4', 'H'), c('5', 'D'), c('7', 'C'), c('8', 'S')])).toBeNull();
      expect(classifyCombo([c('3', 'S'), c('5', 'H'), c('7', 'D'), c('9', 'C'), c('J', 'S')])).toBeNull();
    });
  });

  describe('sequence of pairs boundary cases', () => {
    it('requires minimum 3 consecutive pairs', () => {
      const validSeq = classifyCombo([c('3', 'S'), c('3', 'H'), c('4', 'D'), c('4', 'C'), c('5', 'S'), c('5', 'H')]);
      expect(validSeq).not.toBeNull();
      expect(validSeq?.type).toBe(ComboType.SEQUENCE_OF_PAIRS);
      expect(validSeq?.length).toBe(3);

      // Only 2 pairs is too short
      const twoCards = [c('3', 'S'), c('3', 'H'), c('4', 'D'), c('4', 'C')];
      const twoPairs = classifyCombo(twoCards);
      expect(twoPairs).toBeNull();
    });

    it('rejects mixed pair counts', () => {
      // Two 3s, two 4s, but three 5s - should fail
      const invalid = [c('3', 'S'), c('3', 'H'), c('4', 'D'), c('4', 'C'), c('5', 'S'), c('5', 'H'), c('5', 'D')];
      expect(classifyCombo(invalid)).toBeNull();
    });

    it('rejects sequence of pairs with 2 or jokers', () => {
      expect(classifyCombo([c('K', 'S'), c('K', 'H'), c('A', 'D'), c('A', 'C'), c('2', 'S'), c('2', 'H')])).toBeNull();
    });
  });

  describe('plane (triple sequence) boundary cases', () => {
    it('requires minimum 2 consecutive triples', () => {
      const valid = classifyCombo([...triple('4'), ...triple('5')]);
      expect(valid).not.toBeNull();
      expect(valid?.type).toBe(ComboType.PLANE);
      expect(valid?.length).toBe(2);

      // Just one triple is not a plane
      const single = classifyCombo(triple('7'));
      expect(single?.type).toBe(ComboType.TRIPLE);
    });

    it('rejects planes containing 2 or jokers', () => {
      expect(classifyCombo([...triple('A'), ...triple('2')])).toBeNull();
    });

    it('accepts long planes', () => {
      const longPlane = classifyCombo([...triple('3'), ...triple('4'), ...triple('5'), ...triple('6')]);
      expect(longPlane).not.toBeNull();
      expect(longPlane?.type).toBe(ComboType.PLANE);
      expect(longPlane?.length).toBe(4);
    });
  });

  describe('plane with attachments edge cases', () => {
    it('validates plane with singles requires k triples and k singles', () => {
      // Valid: 2 triples + 2 singles
      const valid = classifyCombo([...triple('6'), ...triple('7'), c('9', 'S'), c('10', 'S')]);
      expect(valid).not.toBeNull();
      expect(valid?.type).toBe(ComboType.PLANE_WITH_SINGLES);

      // Invalid: 2 triples + 1 single
      const invalid1 = classifyCombo([...triple('6'), ...triple('7'), c('9', 'S')]);
      expect(invalid1).toBeNull();

      // Invalid: 2 triples + 3 singles
      const invalid2 = classifyCombo([...triple('6'), ...triple('7'), c('9', 'S'), c('10', 'S'), c('J', 'S')]);
      expect(invalid2).toBeNull();
    });

    it('validates plane with pairs requires k triples and k pairs', () => {
      // Valid: 2 triples + 2 pairs
      const valid = classifyCombo([...triple('9'), ...triple('10'), c('J', 'S'), c('J', 'H'), c('Q', 'S'), c('Q', 'H')]);
      expect(valid).not.toBeNull();
      expect(valid?.type).toBe(ComboType.PLANE_WITH_PAIRS);

      // Invalid: 2 triples + 1 pair + 2 singles
      const invalid = classifyCombo([...triple('9'), ...triple('10'), c('J', 'S'), c('J', 'H'), c('Q', 'S'), c('K', 'H')]);
      expect(invalid).toBeNull();
    });

    it('validates plane with pairs structure', () => {
      // Valid plane with pairs: two consecutive triplets + two pairs of different ranks
      // Pattern from doudizhu.test.ts that works
      const validPlane = classifyCombo([...triple('9'), ...triple('10'), c('J', 'S'), c('J', 'H'), c('Q', 'S'), c('Q', 'H')]);
      expect(validPlane).not.toBeNull();
      expect(validPlane?.type).toBe(ComboType.PLANE_WITH_PAIRS);

      // Plane with singles can use any ranks including 2 and joker
      const withHighCards = classifyCombo([...triple('6'), ...triple('7'), c('2', 'S'), c('Joker', 'JB')]);
      expect(withHighCards).not.toBeNull();
      expect(withHighCards?.type).toBe(ComboType.PLANE_WITH_SINGLES);
    });

    it('rejects plane when triples contain 2', () => {
      // Cannot have triple of 2s as the core
      expect(classifyCombo([...triple('A'), ...triple('2'), c('3', 'S'), c('4', 'H')])).toBeNull();
    });
  });

  describe('four with attachments edge cases', () => {
    it('validates four with two singles has exactly 6 cards', () => {
      const valid = classifyCombo([...quad('Q'), c('2', 'S'), c('3', 'S')]);
      expect(valid).not.toBeNull();
      expect(valid?.type).toBe(ComboType.FOUR_WITH_TWO_SINGLES);

      // 4 cards is just a bomb
      const justBomb = classifyCombo([...quad('8')]);
      expect(justBomb?.type).toBe(ComboType.BOMB);

      // 5 cards with 4 of a kind should fail
      expect(classifyCombo([...quad('7'), c('A', 'S')])).toBeNull();

      // 7 cards should fail
      expect(classifyCombo([...quad('7'), c('A', 'S'), c('2', 'H'), c('3', 'D')])).toBeNull();
    });

    it('validates four with two pairs has exactly 8 cards', () => {
      const valid = classifyCombo([...quad('K'), c('5', 'S'), c('5', 'H'), c('7', 'S'), c('7', 'H')]);
      expect(valid).not.toBeNull();
      expect(valid?.type).toBe(ComboType.FOUR_WITH_TWO_PAIRS);

      // 6 cards (quad + pair + single) should fail
      expect(classifyCombo([...quad('9'), c('3', 'S'), c('3', 'H'), c('4', 'D')])).toBeNull();
    });

    it('rejects four with mixed attachments (one pair, one single)', () => {
      const invalid = classifyCombo([...quad('J'), c('A', 'S'), c('A', 'H'), c('K', 'D')]);
      // This should be null as it doesn't match FOUR_WITH_TWO_SINGLES or FOUR_WITH_TWO_PAIRS
      expect(invalid).toBeNull();
    });

    it('rejects four with attachment being another quad', () => {
      // This is an invalid combo - 4 of kind + 4 of another kind
      expect(classifyCombo([...quad('4'), ...quad('6')])).toBeNull();
    });

    it('allows jokers and 2s as attachments', () => {
      const with2s = classifyCombo([...quad('10'), c('2', 'S'), c('Joker', 'JB')]);
      expect(with2s).not.toBeNull();
      expect(with2s?.type).toBe(ComboType.FOUR_WITH_TWO_SINGLES);
    });
  });

  describe('bomb and rocket edge cases', () => {
    it('identifies bomb as any four of same rank', () => {
      expect(classifyCombo([...quad('3')])?.type).toBe(ComboType.BOMB);
      expect(classifyCombo([...quad('A')])?.type).toBe(ComboType.BOMB);
      expect(classifyCombo([...quad('2')])?.type).toBe(ComboType.BOMB);
    });

    it('requires exactly both jokers for rocket', () => {
      const valid = classifyCombo([c('Joker', 'JB'), c('Joker', 'JR')]);
      expect(valid).not.toBeNull();
      expect(valid?.type).toBe(ComboType.ROCKET);

      // Just one joker
      expect(classifyCombo([c('Joker', 'JB')])?.type).toBe(ComboType.SINGLE);

      // Two small jokers (duplicate) should fail
      const smallJoker = c('Joker', 'JB');
      expect(classifyCombo([smallJoker, smallJoker])).toBeNull();
    });

    it('rejects rocket with additional cards', () => {
      expect(classifyCombo([c('Joker', 'JB'), c('Joker', 'JR'), c('2', 'S')])).toBeNull();
    });
  });

  describe('combo beating rules', () => {
    it('enforces same type and higher rank for normal combos', () => {
      const single3 = classifyCombo([c('3', 'S')])!;
      const single5 = classifyCombo([c('5', 'H')])!;
      const pair3 = classifyCombo([c('3', 'S'), c('3', 'H')])!;

      expect(beats(single5, single3)).toBe(true);
      expect(beats(single3, single5)).toBe(false);
      
      // Different types don't beat each other (unless bomb/rocket)
      expect(beats(pair3, single3)).toBe(false);
      expect(beats(pair3, single5)).toBe(false);
    });

    it('allows bombs to beat any non-bomb combo', () => {
      const single2 = classifyCombo([c('2', 'S')])!;
      const triple2 = classifyCombo([...triple('2')])!;
      const bomb3 = classifyCombo([...quad('3')])!;
      const seqHigh = classifyCombo([c('10', 'S'), c('J', 'H'), c('Q', 'D'), c('K', 'C'), c('A', 'S')])!;

      expect(beats(bomb3, single2)).toBe(true);
      expect(beats(bomb3, triple2)).toBe(true);
      expect(beats(bomb3, seqHigh)).toBe(true);
    });

    it('requires higher rank for bomb vs bomb', () => {
      const bomb4 = classifyCombo([...quad('4')])!;
      const bomb9 = classifyCombo([...quad('9')])!;
      const bombA = classifyCombo([...quad('A')])!;

      expect(beats(bomb9, bomb4)).toBe(true);
      expect(beats(bomb4, bomb9)).toBe(false);
      expect(beats(bombA, bomb9)).toBe(true);
    });

    it('allows rocket to beat any bomb', () => {
      const bomb2 = classifyCombo([...quad('2')])!;
      const rocket = classifyCombo([c('Joker', 'JB'), c('Joker', 'JR')])!;

      expect(beats(rocket, bomb2)).toBe(true);
    });

    it('requires same length for sequences and planes', () => {
      const seq5 = classifyCombo([c('3', 'S'), c('4', 'H'), c('5', 'D'), c('6', 'C'), c('7', 'S')])!;
      const seq6 = classifyCombo([c('4', 'S'), c('5', 'H'), c('6', 'D'), c('7', 'C'), c('8', 'S'), c('9', 'H')])!;
      const seq5Higher = classifyCombo([c('5', 'S'), c('6', 'H'), c('7', 'D'), c('8', 'C'), c('9', 'S')])!;

      expect(beats(seq5Higher, seq5)).toBe(true);
      expect(beats(seq5, seq5Higher)).toBe(false);
      
      // Different lengths can't beat each other
      expect(beats(seq6, seq5)).toBe(false);
      expect(beats(seq5, seq6)).toBe(false);
    });

    it('validates 2 is the highest normal rank', () => {
      const singleA = classifyCombo([c('A', 'S')])!;
      const single2 = classifyCombo([c('2', 'H')])!;

      expect(beats(single2, singleA)).toBe(true);
      expect(beats(singleA, single2)).toBe(false);
    });
  });

  describe('special invalid combinations', () => {
    it('rejects empty combo classification as PASS', () => {
      // Empty array is PASS, not null
      const empty = classifyCombo([]);
      expect(empty).not.toBeNull();
      expect(empty?.type).toBe(ComboType.PASS);
    });

    it('handles mixed structures', () => {
      // 1 triple + 1 pair - this actually forms TRIPLE_WITH_PAIR (5 cards total)
      const tripleWithPair = classifyCombo([...triple('5'), c('7', 'S'), c('7', 'H')]);
      expect(tripleWithPair).not.toBeNull();
      expect(tripleWithPair?.type).toBe(ComboType.TRIPLE_WITH_PAIR);

      // Random mix that truly doesn't match
      expect(classifyCombo([c('3', 'S'), c('4', 'H'), c('5', 'D'), c('5', 'C')])).toBeNull();

      // Three pairs not consecutive
      expect(classifyCombo([c('3', 'S'), c('3', 'H'), c('5', 'D'), c('5', 'C'), c('7', 'S'), c('7', 'H')])).toBeNull();
    });

    it('handles tricky plane-like structures that fail validation', () => {
      // Two triples but with an extra single (not plane with singles - wrong count)
      const almostPlane = classifyCombo([...triple('5'), ...triple('6'), c('7', 'S')]);
      expect(almostPlane).toBeNull();

      // Three non-consecutive triples
      const nonConsec = classifyCombo([...triple('3'), ...triple('5'), ...triple('7')]);
      expect(nonConsec).toBeNull();
    });
  });

  describe('rank 2 special handling', () => {
    it('allows 2 in basic combos but not sequences', () => {
      // 2 can be single, pair, triple, bomb
      expect(classifyCombo([c('2', 'S')])?.type).toBe(ComboType.SINGLE);
      expect(classifyCombo([c('2', 'S'), c('2', 'H')])?.type).toBe(ComboType.PAIR);
      expect(classifyCombo([...triple('2')])?.type).toBe(ComboType.TRIPLE);
      expect(classifyCombo([...quad('2')])?.type).toBe(ComboType.BOMB);

      // But 2 cannot be in a sequence
      expect(classifyCombo([c('K', 'S'), c('A', 'H'), c('2', 'D'), c('3', 'C'), c('4', 'S')])).toBeNull();
    });

    it('allows 2 as attachment in composite combos', () => {
      // 2 can be attachment in triple-with-single
      expect(classifyCombo([...triple('5'), c('2', 'S')])?.type).toBe(ComboType.TRIPLE_WITH_SINGLE);

      // 2 pair can be attachment in triple-with-pair
      expect(classifyCombo([...triple('7'), c('2', 'S'), c('2', 'H')])?.type).toBe(ComboType.TRIPLE_WITH_PAIR);
    });
  });
});
