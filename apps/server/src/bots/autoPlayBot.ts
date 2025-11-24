import type { AppServerSocket } from '@shared/events';
import { derivePhaseStatus } from '@shared/tablePhases';
import type { Combo } from '@game-core/doudizhu';
import { beats, ComboType, rankValue, sortCardsByRank, type RankValue } from '@game-core/doudizhu';
import type { GameCard, GameCombo, GameSnapshot } from '@shared/messages';
import type { ManagedTable, TableManager } from '../domain/tableManager';

const MOVE_DELAY_MS = 250;

const asCombo = (gameCombo: GameCombo | null | undefined): Combo | null => {
  if (!gameCombo) return null;
  return {
    type: gameCombo.type as ComboType,
    cards: gameCombo.cards.map(card => ({ ...card })),
    mainRank: gameCombo.mainRank as RankValue | undefined,
    length: gameCombo.length
  };
};

const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

function createBotSocket(seatId: string): AppServerSocket {
  return {
    id: seatId,
    emit: () => {},
    // The bot does not need to implement other socket behaviors for server-side play actions.
  } as unknown as AppServerSocket;
}

type RankGroup = {
  rank: RankValue;
  cards: GameCard[];
};

function buildRankGroups(hand: GameCard[]): RankGroup[] {
  const groups = new Map<RankValue, GameCard[]>();
  for (const card of hand) {
    const value = rankValue(card);
    groups.set(value, [...(groups.get(value) ?? []), card]);
  }
  return Array.from(groups.entries())
    .map(([rank, cards]) => ({ rank, cards: sortCardsByRank(cards) }))
    .sort((a, b) => a.rank - b.rank);
}

function addSimpleCombos(groups: RankGroup[], combos: Combo[]) {
  for (const group of groups) {
    for (const card of group.cards) {
      combos.push({ type: ComboType.SINGLE, mainRank: group.rank, cards: [card] });
    }
    if (group.cards.length >= 2) {
      combos.push({ type: ComboType.PAIR, mainRank: group.rank, cards: group.cards.slice(0, 2) });
    }
    if (group.cards.length >= 3) {
      combos.push({ type: ComboType.TRIPLE, mainRank: group.rank, cards: group.cards.slice(0, 3) });
    }
    if (group.cards.length >= 4) {
      combos.push({ type: ComboType.BOMB, mainRank: group.rank, cards: group.cards.slice(0, 4) });
    }
  }
}

function addTripleExtensions(groups: RankGroup[], combos: Combo[]) {
  const singles: GameCard[] = [];
  const pairs: GameCard[][] = [];
  for (const group of groups) {
    if (group.cards.length >= 2) {
      pairs.push(group.cards.slice(0, 2));
    }
    singles.push(...group.cards);
  }
  for (const group of groups) {
    if (group.cards.length < 3) continue;
    const triple = group.cards.slice(0, 3);
    const remainingSingles = singles.filter(card => rankValue(card) !== group.rank);
    for (const single of remainingSingles) {
      combos.push({
        type: ComboType.TRIPLE_WITH_SINGLE,
        mainRank: group.rank,
        cards: sortCardsByRank([...triple, single])
      });
    }
    const remainingPairs = pairs.filter(pair => rankValue(pair[0]) !== group.rank);
    for (const pair of remainingPairs) {
      combos.push({
        type: ComboType.TRIPLE_WITH_PAIR,
        mainRank: group.rank,
        cards: sortCardsByRank([...triple, ...pair])
      });
    }
  }
}

function addSequences(groups: RankGroup[], combos: Combo[]) {
  const sequenceEligible = groups.filter(group => group.rank <= 14);
  if (sequenceEligible.length < 5) return;
  let run: RankGroup[] = [];
  const flushRun = () => {
    if (run.length < 5) {
      run = [];
      return;
    }
    for (let start = 0; start <= run.length - 5; start += 1) {
      for (let len = 5; len <= run.length - start; len += 1) {
        const window = run.slice(start, start + len);
        const cards = window.map(group => group.cards[0]);
        combos.push({
          type: ComboType.SEQUENCE,
          mainRank: window[window.length - 1]?.rank,
          length: window.length,
          cards: sortCardsByRank(cards)
        });
      }
    }
    run = [];
  };

  for (let i = 0; i < sequenceEligible.length; i += 1) {
    const current = sequenceEligible[i];
    const previous = sequenceEligible[i - 1];
    if (previous && current.rank !== previous.rank + 1) {
      flushRun();
    }
    run.push(current);
  }
  flushRun();
}

function addPairSequences(groups: RankGroup[], combos: Combo[]) {
  const pairEligible = groups.filter(group => group.rank <= 14 && group.cards.length >= 2);
  if (pairEligible.length < 3) return;
  let run: RankGroup[] = [];
  const flushRun = () => {
    if (run.length < 3) {
      run = [];
      return;
    }
    for (let start = 0; start <= run.length - 3; start += 1) {
      for (let len = 3; len <= run.length - start; len += 1) {
        const window = run.slice(start, start + len);
        const cards = window.flatMap(group => group.cards.slice(0, 2));
        combos.push({
          type: ComboType.SEQUENCE_OF_PAIRS,
          mainRank: window[window.length - 1]?.rank,
          length: window.length,
          cards: sortCardsByRank(cards)
        });
      }
    }
    run = [];
  };

  for (let i = 0; i < pairEligible.length; i += 1) {
    const current = pairEligible[i];
    const previous = pairEligible[i - 1];
    if (previous && current.rank !== previous.rank + 1) {
      flushRun();
    }
    run.push(current);
  }
  flushRun();
}

function addPlanes(groups: RankGroup[], combos: Combo[]) {
  const tripleEligible = groups.filter(group => group.rank <= 14 && group.cards.length >= 3);
  if (tripleEligible.length < 2) return;
  let run: RankGroup[] = [];

  const buildWings = (tripleWindow: RankGroup[]) => {
    const tripleRanks = new Set(tripleWindow.map(group => group.rank));
    const singles = groups
      .flatMap(group => group.cards)
      .filter(card => !tripleRanks.has(rankValue(card)));
    const pairs = groups
      .filter(group => !tripleRanks.has(group.rank) && group.cards.length >= 2)
      .map(group => group.cards.slice(0, 2));

    if (singles.length >= tripleWindow.length) {
      const wingCards = singles.slice(0, tripleWindow.length);
      combos.push({
        type: ComboType.PLANE_WITH_SINGLES,
        mainRank: tripleWindow[tripleWindow.length - 1]?.rank,
        length: tripleWindow.length,
        cards: sortCardsByRank([...tripleWindow.flatMap(group => group.cards.slice(0, 3)), ...wingCards])
      });
    }

    if (pairs.length >= tripleWindow.length) {
      const wingPairs = pairs.slice(0, tripleWindow.length);
      combos.push({
        type: ComboType.PLANE_WITH_PAIRS,
        mainRank: tripleWindow[tripleWindow.length - 1]?.rank,
        length: tripleWindow.length,
        cards: sortCardsByRank([...tripleWindow.flatMap(group => group.cards.slice(0, 3)), ...wingPairs.flat()])
      });
    }
  };

  const flushRun = () => {
    if (run.length < 2) {
      run = [];
      return;
    }
    for (let start = 0; start <= run.length - 2; start += 1) {
      for (let len = 2; len <= run.length - start; len += 1) {
        const window = run.slice(start, start + len);
        combos.push({
          type: ComboType.PLANE,
          mainRank: window[window.length - 1]?.rank,
          length: window.length,
          cards: sortCardsByRank(window.flatMap(group => group.cards.slice(0, 3)))
        });
        buildWings(window);
      }
    }
    run = [];
  };

  for (let i = 0; i < tripleEligible.length; i += 1) {
    const current = tripleEligible[i];
    const previous = tripleEligible[i - 1];
    if (previous && current.rank !== previous.rank + 1) {
      flushRun();
    }
    run.push(current);
  }
  flushRun();
}

function addQuadplex(groups: RankGroup[], combos: Combo[]) {
  const singles = groups.flatMap(group => group.cards);
  const pairs = groups.filter(group => group.cards.length >= 2).map(group => group.cards.slice(0, 2));

  for (const group of groups) {
    if (group.cards.length < 4) continue;
    const availableSingles = singles.filter(card => rankValue(card) !== group.rank);
    if (availableSingles.length >= 2) {
      combos.push({
        type: ComboType.FOUR_WITH_TWO_SINGLES,
        mainRank: group.rank,
        cards: sortCardsByRank([...group.cards.slice(0, 4), ...availableSingles.slice(0, 2)])
      });
    }

    const availablePairs = pairs.filter(pair => rankValue(pair[0]) !== group.rank);
    if (availablePairs.length >= 2) {
      const selectedPairs = availablePairs.slice(0, 2).flat();
      combos.push({
        type: ComboType.FOUR_WITH_TWO_PAIRS,
        mainRank: group.rank,
        cards: sortCardsByRank([...group.cards.slice(0, 4), ...selectedPairs])
      });
    }
  }
}

function addRocket(groups: RankGroup[], combos: Combo[]) {
  const smallJoker = groups.find(group => group.cards.some(card => card.rank === 'Joker' && card.suit === 'JB'));
  const bigJoker = groups.find(group => group.cards.some(card => card.rank === 'Joker' && card.suit === 'JR'));
  if (!smallJoker || !bigJoker) return;
  const small = smallJoker.cards.find(card => card.rank === 'Joker' && card.suit === 'JB');
  const big = bigJoker.cards.find(card => card.rank === 'Joker' && card.suit === 'JR');
  if (!small || !big) return;
  combos.push({
    type: ComboType.ROCKET,
    cards: sortCardsByRank([small, big]),
    mainRank: Math.max(rankValue(small), rankValue(big)) as RankValue
  });
}

function generateCombos(hand: GameCard[]): Combo[] {
  const groups = buildRankGroups(hand);
  const combos: Combo[] = [];
  addSimpleCombos(groups, combos);
  addTripleExtensions(groups, combos);
  addSequences(groups, combos);
  addPairSequences(groups, combos);
  addPlanes(groups, combos);
  addQuadplex(groups, combos);
  addRocket(groups, combos);
  return combos;
}

function buildLeadCandidates(combos: Combo[]): Combo[] {
  const nonPass = combos.filter(combo => combo.type !== ComboType.PASS);
  if (!nonPass.length) return [];
  const orderedTypes = shuffle([...new Set(nonPass.map(combo => combo.type))]);
  const ordered: Combo[] = [];
  for (const type of orderedTypes) {
    const candidates = shuffle(nonPass.filter(combo => combo.type === type));
    ordered.push(...candidates);
  }
  return ordered;
}

function buildFollowCandidates(combos: Combo[], prevCombo: Combo): Combo[] {
  const beating = shuffle(combos.filter(combo => beats(combo, prevCombo)));
  beating.push({ type: ComboType.PASS, cards: [] });
  return beating;
}

export class AutoPlayBot {
  private readonly moveDelayMs: number;
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private unsubscribe?: () => void;

  constructor(private readonly tableManager: TableManager, options: { moveDelayMs?: number } = {}) {
    this.moveDelayMs = options.moveDelayMs ?? MOVE_DELAY_MS;
  }

  start() {
    if (this.unsubscribe) return;
    this.unsubscribe = this.tableManager.onSnapshot((table, snapshot) => this.handleSnapshot(table, snapshot));
  }

  stop() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  private handleSnapshot(table: ManagedTable, snapshot: GameSnapshot) {
    const phase = derivePhaseStatus(table.phase);
    if (phase === 'playing' && snapshot.phase === 'playing') {
      this.ensureTick(table.id);
    } else {
      this.clearTick(table.id);
    }
  }

  private ensureTick(tableId: string) {
    if (this.timers.has(tableId)) return;
    const timer = setTimeout(() => {
      this.timers.delete(tableId);
      this.takeTurn(tableId);
    }, this.moveDelayMs);
    this.timers.set(tableId, timer);
  }

  private clearTick(tableId: string) {
    const timer = this.timers.get(tableId);
    if (timer) {
      clearTimeout(timer);
    }
    this.timers.delete(tableId);
  }

  private takeTurn(tableId: string) {
    const table = this.tableManager.getManagedTable(tableId);
    if (!table || table.variant.id !== 'dou-dizhu') {
      this.clearTick(tableId);
      return;
    }
    if (derivePhaseStatus(table.phase) !== 'playing') {
      this.clearTick(tableId);
      return;
    }

    const snapshot = this.tableManager.getSnapshot(tableId);
    if (!snapshot || snapshot.phase !== 'playing' || !snapshot.currentTurnSeatId) {
      this.ensureTick(tableId);
      return;
    }

    const seatId = snapshot.currentTurnSeatId;
    const player = table.state.players[seatId];
    if (!player) {
      this.ensureTick(tableId);
      return;
    }

    const playState = this.tableManager.getPlayState(tableId, player.userId);
    if (!playState) {
      this.ensureTick(tableId);
      return;
    }

    const prevCombo = asCombo(snapshot.lastCombo);
    const combos = generateCombos(playState.hand);
    const candidates = prevCombo ? buildFollowCandidates(combos, prevCombo) : buildLeadCandidates(combos);
    if (candidates.length === 0) {
      this.rescheduleIfPlaying(tableId);
      return;
    }

    const botSocket = createBotSocket(seatId);
    for (const candidate of candidates) {
      const cardIds = candidate.cards.map(card => card.id);
      let ok = false;
      this.tableManager.handlePlay(botSocket, { tableId, cardIds }, (ack) => {
        ok = ack.ok;
      });
      if (ok) {
        this.rescheduleIfPlaying(tableId);
        return;
      }
    }

    this.rescheduleIfPlaying(tableId);
  }

  private rescheduleIfPlaying(tableId: string) {
    const table = this.tableManager.getManagedTable(tableId);
    if (table && derivePhaseStatus(table.phase) === 'playing') {
      this.ensureTick(tableId);
    } else {
      this.clearTick(tableId);
    }
  }
}
