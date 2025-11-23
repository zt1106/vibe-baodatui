import { describe, expect, it } from 'vitest';

import { makeCard } from '@core-cards/ids';
import {
  ComboType,
  applyBid,
  applyDoublingDecision,
  applyPlay,
  beats,
  classifyCombo,
  createRoundState
} from '../doudizhu';

const c = (rank: Parameters<typeof makeCard>[0], suit: Parameters<typeof makeCard>[1]) => makeCard(rank, suit);

const triple = (rank: Parameters<typeof makeCard>[0]) => [c(rank, 'S'), c(rank, 'H'), c(rank, 'D')];
const quad = (rank: Parameters<typeof makeCard>[0]) => [c(rank, 'S'), c(rank, 'H'), c(rank, 'D'), c(rank, 'C')];

describe('classifyCombo', () => {
  it('identifies the standard combination types', () => {
    expect(classifyCombo([c('3', 'S')])).toMatchObject({ type: ComboType.SINGLE, mainRank: 3 });

    expect(classifyCombo([c('5', 'S'), c('5', 'H')])).toMatchObject({ type: ComboType.PAIR, mainRank: 5 });

    expect(classifyCombo(triple('7'))).toMatchObject({ type: ComboType.TRIPLE, mainRank: 7 });

    expect(classifyCombo([...triple('9'), c('A', 'S')])).toMatchObject({
      type: ComboType.TRIPLE_WITH_SINGLE,
      mainRank: 9
    });

    expect(classifyCombo([...triple('8'), c('4', 'S'), c('4', 'H')])).toMatchObject({
      type: ComboType.TRIPLE_WITH_PAIR,
      mainRank: 8
    });

    expect(classifyCombo([c('3', 'S'), c('4', 'S'), c('5', 'S'), c('6', 'S'), c('7', 'S')])).toMatchObject({
      type: ComboType.SEQUENCE,
      mainRank: 7,
      length: 5
    });

    expect(
      classifyCombo([c('3', 'S'), c('3', 'H'), c('4', 'S'), c('4', 'H'), c('5', 'S'), c('5', 'H')])
    ).toMatchObject({
      type: ComboType.SEQUENCE_OF_PAIRS,
      mainRank: 5,
      length: 3
    });

    expect(classifyCombo([...triple('4'), ...triple('5')])).toMatchObject({
      type: ComboType.PLANE,
      mainRank: 5,
      length: 2
    });

    expect(classifyCombo([...triple('6'), ...triple('7'), c('9', 'S'), c('10', 'S')])).toMatchObject({
      type: ComboType.PLANE_WITH_SINGLES,
      mainRank: 7,
      length: 2
    });

    expect(
      classifyCombo([...triple('9'), ...triple('10'), c('J', 'S'), c('J', 'H'), c('Q', 'S'), c('Q', 'H')])
    ).toMatchObject({
      type: ComboType.PLANE_WITH_PAIRS,
      mainRank: 10,
      length: 2
    });

    expect(classifyCombo([...quad('Q'), c('2', 'S'), c('3', 'S')])).toMatchObject({
      type: ComboType.FOUR_WITH_TWO_SINGLES,
      mainRank: 12
    });

    expect(classifyCombo([...quad('K'), c('5', 'S'), c('5', 'H'), c('7', 'S'), c('7', 'H')])).toMatchObject({
      type: ComboType.FOUR_WITH_TWO_PAIRS,
      mainRank: 13
    });

    expect(classifyCombo([...quad('9')])).toMatchObject({ type: ComboType.BOMB, mainRank: 9 });

    expect(classifyCombo([c('Joker', 'JB'), c('Joker', 'JR')])).toMatchObject({ type: ComboType.ROCKET });
  });

  it('rejects illegal structures', () => {
    const duplicate = c('3', 'S');
    expect(classifyCombo([duplicate, duplicate])).toBeNull();
    expect(classifyCombo([c('10', 'S'), c('J', 'S'), c('Q', 'S'), c('K', 'S'), c('2', 'S')])).toBeNull();
    expect(classifyCombo([...quad('4'), c('6', 'S'), c('6', 'H'), c('6', 'D'), c('6', 'C')])).toBeNull();
    expect(classifyCombo([...triple('5'), ...triple('6'), c('7', 'S'), c('7', 'H')])).toBeNull();
  });
});

describe('combo comparison', () => {
  it('follows beating rules, respecting bombs and rocket', () => {
    const single3 = classifyCombo([c('3', 'S')])!;
    const single4 = classifyCombo([c('4', 'S')])!;
    const pair6 = classifyCombo([c('6', 'S'), c('6', 'H')])!;
    const pair5 = classifyCombo([c('5', 'S'), c('5', 'H')])!;
    const bomb7 = classifyCombo([...quad('7')])!;
    const bomb6 = classifyCombo([...quad('6')])!;
    const rocket = classifyCombo([c('Joker', 'JB'), c('Joker', 'JR')])!;
    const seqLow = classifyCombo([c('3', 'S'), c('4', 'S'), c('5', 'S'), c('6', 'S'), c('7', 'S')])!;
    const seqHigh = classifyCombo([c('4', 'H'), c('5', 'H'), c('6', 'H'), c('7', 'H'), c('8', 'H')])!;

    expect(single4.type).toBe(ComboType.SINGLE);
    expect(pair6.type).toBe(ComboType.PAIR);
    expect(seqHigh.type).toBe(ComboType.SEQUENCE);

    expect(beats(single4, single3)).toBe(true);
    expect(beats(pair5, pair6)).toBe(false);
    expect(beats(bomb7, pair6)).toBe(true);
    expect(beats(bomb6, bomb7)).toBe(false);
    expect(beats(rocket, bomb7)).toBe(true);
    expect(beats(seqLow, seqHigh)).toBe(false);
  });
});

describe('round flow', () => {
  it('runs bidding, doubling, play loop, and scoring with spring + doubling', () => {
    const state = createRoundState('seed-flow', { startingSeat: 0 });
    expect(state.bottomCards).toHaveLength(3);
    expect(state.players[0].hand).toHaveLength(17);

    expect(applyBid(state, 0, 1).ok).toBe(true);
    expect(applyBid(state, 1, 0).ok).toBe(true);
    expect(applyBid(state, 2, 2).ok).toBe(true);
    expect(applyBid(state, 0, 0).ok).toBe(true);
    const bidFinish = applyBid(state, 1, 0);
    expect(bidFinish.ok).toBe(true);
    expect(bidFinish.finished).toBe(true);
    expect(state.phase).toBe('DOUBLING');
    expect(state.landlordSeat).toBe(2);
    expect(state.callScore).toBe(2);
    expect(state.players[2].hand.length).toBe(20);
    expect(state.bottomCards).toHaveLength(0);
    expect(state.doubling.order).toEqual([0, 1, 2]);

    expect(applyDoublingDecision(state, 0, true).ok).toBe(true);
    expect(applyDoublingDecision(state, 1, false).ok).toBe(true);
    const doublingDone = applyDoublingDecision(state, 2, true);
    expect(doublingDone.finished).toBe(true);
    expect(state.phase).toBe('PLAY');
    expect(state.play.currentSeat).toBe(2);

    const landlordCards = [c('3', 'S'), c('7', 'H')];
    const farmer0Cards = [...quad('4'), c('5', 'S')];
    const farmer1Cards = [c('6', 'S'), c('8', 'H')];
    state.players[2].hand = landlordCards.slice();
    state.players[0].hand = farmer0Cards.slice();
    state.players[1].hand = farmer1Cards.slice();
    state.play.lastNonPassCombo = null;
    state.play.lastNonPassSeat = null;
    state.play.history = [];
    state.play.passCountSinceLastPlay = 0;
    state.play.playedCombosBySeat = { 0: 0, 1: 0, 2: 0 };
    state.play.bombCount = 0;
    state.play.rocketCount = 0;

    expect(applyPlay(state, 2, [landlordCards[0]]).ok).toBe(true);
    expect(state.play.lastNonPassCombo?.type).toBe(ComboType.SINGLE);
    expect(applyPlay(state, 0, farmer0Cards.slice(0, 4)).ok).toBe(true); // bomb
    expect(state.play.bombCount).toBe(1);
    expect(applyPlay(state, 1, []).ok).toBe(true); // pass
    expect(applyPlay(state, 2, []).ok).toBe(true); // pass, trick resets to seat 0
    const finishingPlay = applyPlay(state, 0, [farmer0Cards[4]]);
    expect(finishingPlay.finished).toBe(true);
    expect(state.phase).toBe('COMPLETE');
    expect(state.play.winnerSeat).toBe(0);

    const scoring = state.scoring;
    expect(scoring?.spring).toBe(true); // farmer spring: landlord only played once
    expect(scoring?.bombCount).toBe(1);
    expect(scoring?.scores[0]).toBe(32);
    expect(scoring?.scores[1]).toBe(8);
    expect(scoring?.scores[2]).toBe(-40);
  });

  it('flags redeal when all bids are passes', () => {
    const state = createRoundState('seed-redeal', { startingSeat: 1 });
    expect(applyBid(state, 1, 0).finished).toBeFalsy();
    expect(applyBid(state, 2, 0).finished).toBeFalsy();
    const result = applyBid(state, 0, 0);
    expect(result.finished).toBe(true);
    expect(state.bidding.redealRequired).toBe(true);
    expect(state.landlordSeat).toBeNull();
    expect(state.phase).toBe('COMPLETE');
  });
});
