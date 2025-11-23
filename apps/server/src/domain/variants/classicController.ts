import { clearHands, resetDeck } from '@game-core/engine';
import type { ManagedTable } from '../tableTypes';
import type { VariantController, VariantSnapshot } from '../variantController';
import type { TableDealingCoordinator } from '../tableDealing';
import type { PhaseAction } from '../types';

type ClassicControllerDeps = {
  dealing: TableDealingCoordinator;
  emitState: (tableId: string) => void;
  emitGameSnapshot: (table: ManagedTable) => void;
  transitionPhase: (table: ManagedTable, action: PhaseAction) => void;
  updateLobbyFromState: (tableId: string) => void;
  setAllPrepared: (table: ManagedTable, prepared: boolean) => void;
};

export class ClassicController implements VariantController {
  private readonly dealing: TableDealingCoordinator;
  private readonly emitState: ClassicControllerDeps['emitState'];
  private readonly emitGameSnapshot: ClassicControllerDeps['emitGameSnapshot'];
  private readonly transitionPhase: ClassicControllerDeps['transitionPhase'];
  private readonly updateLobbyFromState: ClassicControllerDeps['updateLobbyFromState'];
  private readonly setAllPrepared: ClassicControllerDeps['setAllPrepared'];

  constructor(deps: ClassicControllerDeps) {
    this.dealing = deps.dealing;
    this.emitState = deps.emitState;
    this.emitGameSnapshot = deps.emitGameSnapshot;
    this.transitionPhase = deps.transitionPhase;
    this.updateLobbyFromState = deps.updateLobbyFromState;
    this.setAllPrepared = deps.setAllPrepared;
  }

  start(table: ManagedTable) {
    table.hasStarted = true;
    const dealSeed = `deal-${table.id}-${Date.now()}`;
    resetDeck(table.state, { seed: dealSeed, packs: table.variant.deck.packs });
    clearHands(table.state);
    this.setAllPrepared(table, false);
    table.variantState = {};
    this.updateLobbyFromState(table.id);
    this.emitState(table.id);
    this.dealing.start(table, {
      mode: 'classic',
      stopWhen: current => current.state.deck.length === 0,
      onFinish: current => this.finishDealing(current)
    });
  }

  buildSnapshot(table: ManagedTable): VariantSnapshot {
    return { deckCount: table.state.deck.length };
  }

  private finishDealing(table: ManagedTable) {
    this.dealing.stop(table);
    this.transitionPhase(table, { type: 'start-playing', reason: 'deck-depleted' });
    this.emitGameSnapshot(table);
  }
}
