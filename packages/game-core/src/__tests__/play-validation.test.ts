import { describe, expect, it } from 'vitest';

import { makeCard } from '@core-cards/ids';
import { createPlayValidator, classifyCombo, ComboType } from '../doudizhu';

const c = (rank: Parameters<typeof makeCard>[0], suit: Parameters<typeof makeCard>[1]) => makeCard(rank, suit);

describe('play validation - invalid combo rejection', () => {
  const validator = createPlayValidator();

  describe('validateLead - leading play validation', () => {
    it('rejects invalid card combinations when leading', () => {
      // Two cards of different ranks (not a pair)
      const invalid1 = validator.validateLead([c('3', 'S'), c('4', 'H')]);
      expect(invalid1.ok).toBe(false);
      expect(invalid1.reason).toBeTruthy();

      // Three cards but not all same rank
      const invalid2 = validator.validateLead([c('5', 'S'), c('5', 'H'), c('6', 'D')]);
      expect(invalid2.ok).toBe(false);

      // Invalid sequence (too short)
      const invalid3 = validator.validateLead([c('7', 'S'), c('8', 'H'), c('9', 'D'), c('10', 'C')]);
      expect(invalid3.ok).toBe(false);

      // Sequence with gap
      const invalid4 = validator.validateLead([c('3', 'S'), c('4', 'H'), c('6', 'D'), c('7', 'C'), c('8', 'S')]);
      expect(invalid4.ok).toBe(false);

      // Sequence containing 2
      const invalid5 = validator.validateLead([c('10', 'S'), c('J', 'H'), c('Q', 'D'), c('K', 'C'), c('2', 'S')]);
      expect(invalid5.ok).toBe(false);
    });

    it('accepts valid combos when leading', () => {
      const validSingle = validator.validateLead([c('3', 'S')]);
      expect(validSingle.ok).toBe(true);
      expect(validSingle.combo?.type).toBe(ComboType.SINGLE);

      const validPair = validator.validateLead([c('5', 'S'), c('5', 'H')]);
      expect(validPair.ok).toBe(true);
      expect(validPair.combo?.type).toBe(ComboType.PAIR);

      const validSeq = validator.validateLead([c('3', 'S'), c('4', 'H'), c('5', 'D'), c('6', 'C'), c('7', 'S')]);
      expect(validSeq.ok).toBe(true);
      expect(validSeq.combo?.type).toBe(ComboType.SEQUENCE);
    });

    it('rejects duplicate cards in combo', () => {
      const card = c('3', 'S');
      const invalid = validator.validateLead([card, card]);
      expect(invalid.ok).toBe(false);
    });

    it('rejects empty array for leading (pass not allowed)', () => {
      // Empty means PASS, which should be rejected when leading
      const result = validator.validateLead([]);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('pass-not-allowed-when-leading');
    });
  });

  describe('validateFollow - following play validation', () => {
    it('rejects combos that dont beat previous combo', () => {
      const prevSingle = classifyCombo([c('5', 'S')])!;
      
      // Try to follow single with pair - different type
      const pairFollow = validator.validateFollow([c('7', 'S'), c('7', 'H')], prevSingle);
      expect(pairFollow.ok).toBe(false);
      // The validator returns 'does-not-beat' for all non-beating cases
      expect(pairFollow.reason).toBe('does-not-beat');
    });

    it('rejects combos that dont beat previous rank', () => {
      const prevSingle = classifyCombo([c('8', 'S')])!;
      
      // Lower rank single
      const lowerSingle = validator.validateFollow([c('5', 'H')], prevSingle);
      expect(lowerSingle.ok).toBe(false);
      expect(lowerSingle.reason).toBe('does-not-beat');

      // Same rank single
      const sameSingle = validator.validateFollow([c('8', 'D')], prevSingle);
      expect(sameSingle.ok).toBe(false);
      expect(sameSingle.reason).toBe('does-not-beat');
    });

    it('rejects sequences of different lengths', () => {
      const prevSeq5 = classifyCombo([c('3', 'S'), c('4', 'H'), c('5', 'D'), c('6', 'C'), c('7', 'S')])!;
      
      // 6-card sequence can't beat 5-card sequence
      const seq6 = validator.validateFollow([c('5', 'S'), c('6', 'H'), c('7', 'D'), c('8', 'C'), c('9', 'S'), c('10', 'H')], prevSeq5);
      expect(seq6.ok).toBe(false);
      // Different lengths result in does-not-beat
      expect(seq6.reason).toBe('does-not-beat');
    });

    it('allows bombs to beat any non-bomb combo', () => {
      const prevTriple = classifyCombo([c('K', 'S'), c('K', 'H'), c('K', 'D')])!;
      const bomb = [c('3', 'S'), c('3', 'H'), c('3', 'D'), c('3', 'C')];
      
      const bombFollow = validator.validateFollow(bomb, prevTriple);
      expect(bombFollow.ok).toBe(true);
      expect(bombFollow.combo?.type).toBe(ComboType.BOMB);
    });

    it('allows rocket to beat any combo including bombs', () => {
      const prevBomb = classifyCombo([c('2', 'S'), c('2', 'H'), c('2', 'D'), c('2', 'C')])!;
      const rocket = [c('Joker', 'JB'), c('Joker', 'JR')];
      
      const rocketFollow = validator.validateFollow(rocket, prevBomb);
      expect(rocketFollow.ok).toBe(true);
      expect(rocketFollow.combo?.type).toBe(ComboType.ROCKET);
    });

    it('allows pass on any previous combo', () => {
      const prevSingle = classifyCombo([c('A', 'S')])!;
      
      const pass = validator.validateFollow([], prevSingle);
      expect(pass.ok).toBe(true);
      expect(pass.combo?.type).toBe(ComboType.PASS);
    });

    it('rejects invalid combo structure when following', () => {
      const prevSingle = classifyCombo([c('5', 'S')])!;
      
      // Two different ranks - invalid combo
      const invalid = validator.validateFollow([c('7', 'S'), c('8', 'H')], prevSingle);
      expect(invalid.ok).toBe(false);
      expect(invalid.reason).toBeTruthy();
    });
  });

  describe('complex invalid combo scenarios', () => {
    it('rejects plane with wrong number of attachments', () => {
      // Two triples but only one single (needs 2)
      const invalid = [
        c('3', 'S'), c('3', 'H'), c('3', 'D'),
        c('4', 'S'), c('4', 'H'), c('4', 'D'),
        c('5', 'C')
      ];
      
      const result = validator.validateLead(invalid);
      expect(result.ok).toBe(false);
    });

    it('rejects four-with-attachments with wrong structure', () => {
      // Four of a kind with one pair and one single (must be 2 pairs or 2 singles)
      const invalid = [
        c('7', 'S'), c('7', 'H'), c('7', 'D'), c('7', 'C'),
        c('8', 'S'), c('8', 'H'),
        c('9', 'D')
      ];
      
      const result = validator.validateLead(invalid);
      expect(result.ok).toBe(false);
    });

    it('rejects non-consecutive triplet sequences', () => {
      // Triplets of 3, 5 (not consecutive)
      const invalid = [
        c('3', 'S'), c('3', 'H'), c('3', 'D'),
        c('5', 'S'), c('5', 'H'), c('5', 'D')
      ];
      
      const result = validator.validateLead(invalid);
      expect(result.ok).toBe(false);
    });

    it('rejects plane containing rank 2', () => {
      // Plane cannot have 2 in the triplet core
      const invalid = [
        c('A', 'S'), c('A', 'H'), c('A', 'D'),
        c('2', 'S'), c('2', 'H'), c('2', 'D')
      ];
      
      const result = validator.validateLead(invalid);
      expect(result.ok).toBe(false);
    });
  });

  describe('edge cases in beating logic', () => {
    it('requires bomb to beat bomb with higher rank', () => {
      const bomb5 = classifyCombo([c('5', 'S'), c('5', 'H'), c('5', 'D'), c('5', 'C')])!;
      
      // Lower bomb can't beat
      const bomb4 = [c('4', 'S'), c('4', 'H'), c('4', 'D'), c('4', 'C')];
      const lowerBomb = validator.validateFollow(bomb4, bomb5);
      expect(lowerBomb.ok).toBe(false);
      expect(lowerBomb.reason).toBe('does-not-beat');

      // Same rank can't beat
      const bomb5Again = [c('5', 'C'), c('5', 'D'), c('5', 'H'), c('5', 'S')];
      const sameBomb = validator.validateFollow(bomb5Again, bomb5);
      expect(sameBomb.ok).toBe(false);

      // Higher bomb beats
      const bomb6 = [c('6', 'S'), c('6', 'H'), c('6', 'D'), c('6', 'C')];
      const higherBomb = validator.validateFollow(bomb6, bomb5);
      expect(higherBomb.ok).toBe(true);
    });

    it('validates plane-with-attachments beating rules', () => {
      const plane34 = classifyCombo([
        c('3', 'S'), c('3', 'H'), c('3', 'D'),
        c('4', 'S'), c('4', 'H'), c('4', 'D'),
        c('5', 'C'), c('6', 'C')
      ])!; // Plane 3-4 with two singles
      
      // Same length plane with higher rank should beat
      const plane56 = [
        c('5', 'S'), c('5', 'H'), c('5', 'D'),
        c('6', 'S'), c('6', 'H'), c('6', 'D'),
        c('7', 'C'), c('8', 'C')
      ];
      const higherPlane = validator.validateFollow(plane56, plane34);
      expect(higherPlane.ok).toBe(true);
      
      // Different length plane should not beat
      const plane567 = [
        c('5', 'S'), c('5', 'H'), c('5', 'D'),
        c('6', 'S'), c('6', 'H'), c('6', 'D'),
        c('7', 'S'), c('7', 'H'), c('7', 'D'),
        c('8', 'C'), c('9', 'C'), c('10', 'C')
      ];
      const differentLength = validator.validateFollow(plane567, plane34);
      expect(differentLength.ok).toBe(false);
      // Different lengths don't beat
      expect(differentLength.reason).toBe('does-not-beat');
    });

    it('validates that 2 is highest normal rank', () => {
      const ace = classifyCombo([c('A', 'S')])!;
      
      // 2 beats ace
      const two = validator.validateFollow([c('2', 'H')], ace);
      expect(two.ok).toBe(true);
      
      const pair2 = classifyCombo([c('2', 'S'), c('2', 'H')])!;
      const pairA = [c('A', 'S'), c('A', 'H')];
      
      // Pair of A can't beat pair of 2
      const aPair = validator.validateFollow(pairA, pair2);
      expect(aPair.ok).toBe(false);
    });
  });
});
