import { clearHands, resetDeck } from '@game-core/engine';
import type { Combo } from '@game-core/doudizhu';
import { advanceTrick, ComboType, createPlayValidator } from '@game-core/doudizhu';
import type { AppServerSocket } from '@shared/events';
import type { GameCard, GameResult } from '@shared/messages';
import { derivePhaseStatus } from '@shared/tablePhases';
import type { ManagedTable, DouDizhuVariantState, BidValue } from '../tableTypes';
import type { VariantController, VariantSnapshot } from '../variantController';
import type { TableDealingCoordinator } from '../tableDealing';
import type { PhaseAction } from '../types';

type DouDizhuControllerDeps = {
  dealing: TableDealingCoordinator;
  emitState: (tableId: string) => void;
  emitGameSnapshot: (table: ManagedTable, lastDealtSeatId?: string) => void;
  transitionPhase: (table: ManagedTable, action: PhaseAction) => void;
  updateLobbyFromState: (tableId: string) => void;
  setAllPrepared: (table: ManagedTable, prepared: boolean) => void;
  nextSeatId: (table: ManagedTable, seatId: string) => string;
  completeGame: (table: ManagedTable, result?: GameResult) => void;
  logStructured: (event: string, context: Record<string, unknown>) => void;
};

export class DouDizhuController implements VariantController {
  private readonly dealing: TableDealingCoordinator;
  private readonly emitState: DouDizhuControllerDeps['emitState'];
  private readonly emitGameSnapshot: DouDizhuControllerDeps['emitGameSnapshot'];
  private readonly transitionPhase: DouDizhuControllerDeps['transitionPhase'];
  private readonly updateLobbyFromState: DouDizhuControllerDeps['updateLobbyFromState'];
  private readonly setAllPrepared: DouDizhuControllerDeps['setAllPrepared'];
  private readonly nextSeatId: DouDizhuControllerDeps['nextSeatId'];
  private readonly completeGame: DouDizhuControllerDeps['completeGame'];
  private readonly logStructured: DouDizhuControllerDeps['logStructured'];
  private readonly validator = createPlayValidator();

  constructor(deps: DouDizhuControllerDeps) {
    this.dealing = deps.dealing;
    this.emitState = deps.emitState;
    this.emitGameSnapshot = deps.emitGameSnapshot;
    this.transitionPhase = deps.transitionPhase;
    this.updateLobbyFromState = deps.updateLobbyFromState;
    this.setAllPrepared = deps.setAllPrepared;
    this.nextSeatId = deps.nextSeatId;
    this.completeGame = deps.completeGame;
    this.logStructured = deps.logStructured;
  }

  start(table: ManagedTable) {
    table.hasStarted = true;
    const dealSeed = `deal-${table.id}-${Date.now()}`;
    resetDeck(table.state, { seed: dealSeed, packs: table.variant.deck.packs });
    clearHands(table.state);
    this.setAllPrepared(table, false);
    table.variantState = { bottomCards: [], bidding: null, doubling: undefined, play: undefined };
    this.updateLobbyFromState(table.id);
    this.emitState(table.id);
    this.dealing.start(table, {
      mode: 'dou-dizhu',
      stopWhen: current => current.state.deck.length <= 3,
      onFinish: current => this.finishDealing(current)
    });
  }

  buildSnapshot(table: ManagedTable): VariantSnapshot {
    const state = this.getState(table);
    const deckCount = table.state.deck.length + (state.bottomCards?.length ?? 0);
    const doublingSnapshot =
      state?.doubling && state.landlordSeatId
        ? {
          currentSeatId: state.doubling.finished
            ? state.landlordSeatId
            : state.doubling.order[state.doubling.turnIndex] ?? state.landlordSeatId,
          defenderDoubles: state.doubling.defenderDoubles,
          landlordRedoubled: state.doubling.landlordRedoubled,
          finished: state.doubling.finished
        }
        : undefined;
    const lastComboSnapshot =
      state?.play?.lastCombo && state.play.lastSeatId
        ? {
          seatId: state.play.lastSeatId,
          type: state.play.lastCombo.type,
          cards: state.play.lastCombo.cards.map(card => ({ ...card })),
          mainRank: state.play.lastCombo.mainRank,
          length: state.play.lastCombo.length
        }
        : undefined;
    const trickCombos =
      state?.play?.trickCombos && Object.keys(state.play.trickCombos).length > 0
        ? Object.fromEntries(
          Object.entries(state.play.trickCombos).map(([seatId, combo]) => [
            seatId,
            {
              seatId,
              type: combo.type,
              cards: combo.cards.map(card => ({ ...card, faceUp: true })),
              mainRank: combo.mainRank,
              length: combo.length
            }
          ])
        )
        : undefined;
    return {
      deckCount,
      landlordSeatId: state?.landlordSeatId,
      bidding: state?.bidding ?? undefined,
      doubling: doublingSnapshot,
      lastCombo: lastComboSnapshot,
      trickCombos,
      callScore: state?.callScore
    };
  }

  resolveCurrentTurnSeatId(table: ManagedTable, lastDealtSeatId?: string): string | undefined {
    if (table.phase.status === 'dealing') {
      const seats = table.state.seats;
      if (seats.length === 0) return undefined;
      const seatIndex = table.dealingState?.seatIndex ?? 0;
      const normalized = seatIndex % seats.length;
      return seats[normalized];
    }
    const state = this.getState(table);
    if (table.phase.status === 'bidding') {
      return state.bidding?.currentSeatId;
    }
    if (table.phase.status === 'doubling') {
      const order = state.doubling?.order ?? [];
      const turnIndex = state.doubling?.turnIndex ?? 0;
      return order[turnIndex];
    }
    if (table.phase.status === 'playing') {
      const playSeat = state.play?.currentSeatId;
      if (playSeat) return playSeat;
      const landlordSeat = state.landlordSeatId;
      if (landlordSeat && table.state.seats.includes(landlordSeat)) {
        return landlordSeat;
      }
      const hostSeat = table.state.seats.find(id => table.state.players[id]?.userId === table.host.userId);
      return hostSeat ?? table.state.seats[0];
    }
    return lastDealtSeatId;
  }

  handleBid(
    managed: ManagedTable,
    socket: AppServerSocket,
    payload: { bid: number },
    ack?: (result: { ok: boolean; message?: string }) => void
  ) {
    if (!managed.hasStarted || derivePhaseStatus(managed.phase) !== 'bidding') {
      ack?.({ ok: false, message: '当前阶段不可叫分' });
      return;
    }
    const seatId = socket.id;
    if (!managed.state.seats.includes(seatId)) {
      ack?.({ ok: false, message: '未在牌桌中' });
      return;
    }
    const bid = Number(payload.bid);
    if (!Number.isFinite(bid) || bid < 0 || bid > 3) {
      ack?.({ ok: false, message: '无效叫分' });
      return;
    }

    const state = this.getState(managed);
    const bidding = state.bidding;
    if (!bidding || bidding.finished) {
      ack?.({ ok: false, message: '叫分已结束' });
      return;
    }
    if (bidding.currentSeatId !== seatId) {
      ack?.({ ok: false, message: '未轮到你叫分' });
      return;
    }
    if (bid > 0 && bid <= bidding.highestBid) {
      ack?.({ ok: false, message: '必须叫更高的分数' });
      return;
    }

    bidding.bidsTaken += 1;
    if (bid === 0) {
      bidding.consecutivePasses += 1;
    } else {
      bidding.highestBid = bid as BidValue;
      bidding.highestBidderSeatId = seatId;
      bidding.consecutivePasses = 0;
    }

    const seats = managed.state.seats;
    const needStop =
      bid === 3 ||
      (bidding.bidsTaken >= seats.length && bidding.highestBidderSeatId !== null && bidding.consecutivePasses >= 2) ||
      (bidding.bidsTaken >= seats.length && bidding.highestBidderSeatId === null);

    if (!needStop) {
      bidding.currentSeatId = this.nextSeatId(managed, seatId);
      this.emitGameSnapshot(managed);
      ack?.({ ok: true });
      return;
    }

    this.finalizeBidding(managed);
    ack?.({ ok: true });
  }

  handleDouble(
    managed: ManagedTable,
    socket: AppServerSocket,
    payload: { double: boolean },
    ack?: (result: { ok: boolean; message?: string }) => void
  ) {
    if (!managed.hasStarted || derivePhaseStatus(managed.phase) !== 'doubling') {
      ack?.({ ok: false, message: '当前阶段不可加倍' });
      return;
    }
    const seatId = socket.id;
    if (!managed.state.seats.includes(seatId)) {
      ack?.({ ok: false, message: '未在牌桌中' });
      return;
    }
    const state = this.getState(managed);
    const doubling = state.doubling;
    if (!doubling || doubling.finished) {
      ack?.({ ok: false, message: '加倍已结束' });
      return;
    }
    const orderSeat = doubling.order[doubling.turnIndex];
    if (orderSeat !== seatId) {
      ack?.({ ok: false, message: '未轮到你加倍' });
      return;
    }
    const landlordSeat = state.landlordSeatId;
    if (landlordSeat && seatId === landlordSeat) {
      doubling.landlordRedoubled = payload.double;
    } else {
      doubling.defenderDoubles[seatId] = payload.double;
    }
    doubling.turnIndex += 1;
    if (doubling.turnIndex >= doubling.order.length) {
      doubling.finished = true;
      this.startPlayingPhase(managed);
      ack?.({ ok: true });
      return;
    }
    this.emitGameSnapshot(managed);
    ack?.({ ok: true });
  }

  private buildGameResult(managed: ManagedTable, winnerSeatId: string): GameResult {
    const state = this.getState(managed);
    const landlordSeatId = state.landlordSeatId;
    const landlordUserId = landlordSeatId ? managed.state.players[landlordSeatId]?.userId ?? null : null;
    const breakdown = this.computeScoreBreakdown(managed, winnerSeatId);

    return {
      winner: breakdown.winner,
      landlordUserId,
      winningUserIds: breakdown.winningUserIds,
      finishedAt: Date.now(),
      callScore: breakdown.callScore,
      bombCount: breakdown.bombCount,
      rocketCount: breakdown.rocketCount,
      spring: breakdown.spring,
      landlordRedoubled: breakdown.landlordRedoubled,
      usePerDefenderDoubling: breakdown.usePerDefenderDoubling,
      scores: breakdown.scores
    };
  }

  private computeScoreBreakdown(managed: ManagedTable, winnerSeatId: string) {
    const state = this.getState(managed);
    const landlordSeatId = state.landlordSeatId ?? '';
    const winner: 'LANDLORD' | 'FARMERS' =
      landlordSeatId && winnerSeatId === landlordSeatId ? 'LANDLORD' : 'FARMERS';
    const winningSeats =
      winner === 'LANDLORD'
        ? [landlordSeatId || winnerSeatId]
        : managed.state.seats.filter(id => id !== landlordSeatId);
    const winningUserIds = winningSeats
      .map(id => managed.state.players[id]?.userId)
      .filter((userId): userId is number => typeof userId === 'number');

    const bombCount = state.play?.bombCount ?? 0;
    const rocketCount = state.play?.rocketCount ?? 0;
    const callScore = state.callScore ?? 0;
    const landlordRedoubled = state.doubling?.landlordRedoubled ?? false;
    const usePerDefenderDoubling = true;
    const spring = this.computeSpring(state);

    const farmersWin = winner === 'FARMERS';
    const winFactor = farmersWin ? 1 : -1;
    const exponentCommon = bombCount + rocketCount + (spring ? 1 : 0);
    const defenderSeats = managed.state.seats.filter(id => id !== landlordSeatId);
    const farmerOutcomes = defenderSeats.map(seatId => {
      const doubled = state.doubling?.defenderDoubles[seatId] ?? false;
      const d_i = doubled ? 1 : 0;
      const redoubleApplies = landlordRedoubled && (usePerDefenderDoubling ? doubled : true);
      const d_L = redoubleApplies ? 1 : 0;
      const exponent = exponentCommon + d_i + d_L;
      const multiplier = 2 ** exponent;
      const score = callScore * winFactor * multiplier;
      const player = managed.state.players[seatId];
      return {
        userId: player?.userId ?? 0,
        seatId,
        nickname: player?.nickname ?? '未知玩家',
        role: 'FARMER' as const,
        score,
        doubled,
        exponent,
        multiplier,
        factors: {
          bombs: bombCount,
          rockets: rocketCount,
          spring,
          defenderDouble: doubled,
          landlordRedouble: redoubleApplies
        }
      };
    });

    const landlordScore = -farmerOutcomes.reduce((sum, entry) => sum + entry.score, 0);
    const landlord = managed.state.players[landlordSeatId];
    const landlordFactors = {
      bombs: bombCount,
      rockets: rocketCount,
      spring,
      defenderDouble: false,
      landlordRedouble: landlordRedoubled
    };
    const scores = [
      ...farmerOutcomes,
      {
        userId: landlord?.userId ?? 0,
        seatId: landlordSeatId,
        nickname: landlord?.nickname ?? '未知玩家',
        role: 'LANDLORD' as const,
        score: landlordScore,
        doubled: landlordRedoubled,
        exponent: null,
        multiplier: null,
        factors: landlordFactors
      }
    ];

    return {
      winner,
      winningUserIds,
      bombCount,
      rocketCount,
      callScore,
      spring,
      landlordRedoubled,
      usePerDefenderDoubling,
      scores
    };
  }

  private computeSpring(state: DouDizhuVariantState) {
    const landlordSeatId = state.landlordSeatId;
    const play = state.play;
    if (!landlordSeatId || !play) return false;
    const landlordPlays = play.playedCombosBySeat[landlordSeatId] ?? 0;
    const farmerPlays = Object.entries(play.playedCombosBySeat)
      .filter(([seatId]) => seatId !== landlordSeatId)
      .map(([, count]) => count ?? 0);

    const landlordSpring = (farmerPlays[0] ?? 0) === 0 && (farmerPlays[1] ?? 0) === 0;
    const farmerSpring =
      landlordPlays === 1 && play.firstComboSeatId === landlordSeatId;
    return Boolean(landlordSpring || farmerSpring);
  }

  handlePlay(
    managed: ManagedTable,
    socket: AppServerSocket,
    payload: { cardIds: number[] },
    ack?: (result: { ok: boolean; message?: string }) => void
  ) {
    if (!managed.hasStarted || derivePhaseStatus(managed.phase) !== 'playing') {
      ack?.({ ok: false, message: '当前阶段不可出牌' });
      return;
    }
    const seatId = socket.id;
    if (!managed.state.seats.includes(seatId)) {
      ack?.({ ok: false, message: '未在牌桌中' });
      return;
    }
    const state = this.getState(managed);
    const play = state.play;
    if (!play || play.finished) {
      ack?.({ ok: false, message: '本局已结束' });
      return;
    }
    if (play.currentSeatId !== seatId) {
      ack?.({ ok: false, message: '未轮到你出牌' });
      return;
    }
    const player = managed.state.players[seatId];
    if (!player) {
      ack?.({ ok: false, message: '玩家不存在' });
      return;
    }
    const { selectedCards, missing } = this.extractCardsById(player.hand, payload.cardIds ?? []);
    if (missing.length > 0 || selectedCards.length !== payload.cardIds.length) {
      ack?.({ ok: false, message: '手牌不足以出这些牌' });
      return;
    }

    const hasPrev = play.lastCombo != null;
    const validation = hasPrev
      ? this.validator.validateFollow(selectedCards, play.lastCombo as Combo)
      : this.validator.validateLead(selectedCards);

    if (!validation.ok || !validation.combo) {
      ack?.({ ok: false, message: validation.reason ?? '非法出牌' });
      return;
    }

    const combo = validation.combo;
    const trickAdvance = advanceTrick({
      combo,
      seatId,
      state: {
        lastCombo: play.lastCombo,
        lastSeatId: play.lastSeatId,
        passCountSinceLastPlay: play.passCount
      },
      getNextSeat: (id: string) => this.nextSeatId(managed, id)
    });

    if (!trickAdvance.ok) {
      const reason = trickAdvance.reason === 'cannot-pass-when-leading' ? '首家不可过牌' : '非法出牌';
      ack?.({ ok: false, message: reason });
      return;
    }

    if (combo.type !== ComboType.PASS) {
      player.hand = this.removeCards(player.hand, combo.cards);
      play.trickCombos[seatId] = combo;
      if (!play.playedCombosBySeat[seatId]) {
        play.playedCombosBySeat[seatId] = 0;
      }
      play.playedCombosBySeat[seatId] += 1;
      if (!play.firstComboSeatId) {
        play.firstComboSeatId = seatId;
      }
      if (combo.type === ComboType.BOMB) {
        play.bombCount = (play.bombCount ?? 0) + 1;
      } else if (combo.type === ComboType.ROCKET) {
        play.rocketCount = (play.rocketCount ?? 0) + 1;
      }
    }

    play.lastCombo = trickAdvance.state.lastCombo;
    play.lastSeatId = trickAdvance.state.lastSeatId;
    play.passCount = trickAdvance.state.passCountSinceLastPlay;
    if (trickAdvance.trickEnded) {
      play.trickCombos = {};
    }

    if (player.hand.length === 0 && combo.type !== ComboType.PASS) {
      play.finished = true;
      this.transitionPhase(managed, { type: 'complete', reason: 'stopped' });
      const result = this.buildGameResult(managed, seatId);
      this.emitGameSnapshot(managed);
      this.completeGame(managed, result);
      ack?.({ ok: true });
      return;
    }

    play.currentSeatId = trickAdvance.nextSeatId;

    this.emitGameSnapshot(managed);
    ack?.({ ok: true });
  }

  private getState(table: ManagedTable): DouDizhuVariantState {
    const current = table.variantState ?? {};
    if (
      current &&
      typeof current === 'object' &&
      'bottomCards' in current &&
      Array.isArray((current as DouDizhuVariantState).bottomCards)
    ) {
      return current as DouDizhuVariantState;
    }
    const fresh: DouDizhuVariantState = { bottomCards: [], bidding: null };
    table.variantState = fresh;
    return fresh;
  }

  private createInitialBiddingState(table: ManagedTable) {
    const seats = table.state.seats;
    const startingSeatId = seats[0];
    return {
      currentSeatId: startingSeatId,
      startingSeatId,
      highestBid: 0 as BidValue,
      highestBidderSeatId: null,
      bidsTaken: 0,
      consecutivePasses: 0,
      finished: false
    };
  }

  private finishDealing(table: ManagedTable) {
    this.dealing.stop(table);
    const bottomCards = table.state.deck.map(card => ({ ...card }));
    table.state.deck = [];
    const state = this.getState(table);
    state.bottomCards = bottomCards;
    state.bidding = this.createInitialBiddingState(table);
    state.landlordSeatId = undefined;
    state.callScore = undefined;
    this.transitionPhase(table, { type: 'start-bidding', reason: 'bottom-cards' });
    this.emitGameSnapshot(table);
  }

  private finalizeBidding(table: ManagedTable) {
    const state = this.getState(table);
    const bidding = state.bidding;
    if (!bidding) return;
    bidding.finished = true;
    if (!bidding.highestBidderSeatId) {
      bidding.redealRequired = true;
      this.logStructured('bidding:redeal', {
        tableId: table.id,
        traceId: 'traceId' in table.phase ? (table.phase as any).traceId : undefined,
        reason: 'all-pass'
      });
      this.start(table);
      return;
    }
    const landlordSeatId = bidding.highestBidderSeatId;
    state.landlordSeatId = landlordSeatId;
    state.callScore = bidding.highestBid;
    const landlord = table.state.players[landlordSeatId];
    if (landlord) {
      landlord.hand.push(...state.bottomCards);
    }
    state.bottomCards = [];
    state.doubling = {
      order: table.state.seats.filter(id => id !== landlordSeatId).concat([landlordSeatId]),
      turnIndex: 0,
      defenderDoubles: {},
      landlordRedoubled: false,
      finished: false
    };
    this.transitionPhase(table, { type: 'start-doubling', reason: 'bidding-complete' });
    this.emitGameSnapshot(table);
  }

  private startPlayingPhase(table: ManagedTable) {
    const state = this.getState(table);
    const landlordSeatId = state.landlordSeatId ?? table.state.seats[0];
    state.play = {
      currentSeatId: landlordSeatId,
      lastCombo: null,
      lastSeatId: null,
      passCount: 0,
      finished: false,
      trickCombos: {},
      bombCount: 0,
      rocketCount: 0,
      playedCombosBySeat: {}
    };
    this.transitionPhase(table, { type: 'start-playing', reason: 'doubling-complete' });
    this.emitGameSnapshot(table);
  }

  private extractCardsById(hand: GameCard[], cardIds: number[]) {
    const counts = new Map<number, number>();
    for (const card of hand) {
      counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
    }
    const selected: GameCard[] = [];
    const missing: number[] = [];
    for (const id of cardIds) {
      const remaining = (counts.get(id) ?? 0) - 1;
      if (remaining < 0) {
        missing.push(id);
        continue;
      }
      counts.set(id, remaining);
      const card = hand.find(c => c.id === id);
      if (card) {
        selected.push(card);
      }
    }
    return { selectedCards: selected, missing };
  }

  private removeCards(hand: GameCard[], toRemove: GameCard[]) {
    const removeCounts = new Map<number, number>();
    for (const card of toRemove) {
      removeCounts.set(card.id, (removeCounts.get(card.id) ?? 0) + 1);
    }
    const kept: typeof hand = [];
    for (const card of hand) {
      const remaining = (removeCounts.get(card.id) ?? 0) - 1;
      if (remaining >= 0) {
        removeCounts.set(card.id, remaining);
        continue;
      }
      kept.push(card);
    }
    return kept;
  }
}
