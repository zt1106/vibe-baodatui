import { Combo, ComboType } from './types';

export type TrickState<SeatId> = {
  lastCombo: Combo | null;
  lastSeatId: SeatId | null;
  passCountSinceLastPlay: number;
};

export type AdvanceTrickParams<SeatId> = {
  seatId: SeatId;
  combo: Combo;
  state: TrickState<SeatId>;
  getNextSeat: (seatId: SeatId) => SeatId;
};

export type AdvanceTrickResult<SeatId> =
  | {
      ok: true;
      nextSeatId: SeatId;
      trickEnded: boolean;
      state: TrickState<SeatId>;
    }
  | { ok: false; reason: 'cannot-pass-when-leading' };

/**
 * Applies Dou Dizhu trick rules (section 7) to advance turn order.
 * Handles pass counting and resets the trick after two consecutive passes.
 */
export function advanceTrick<SeatId>({
  seatId,
  combo,
  state,
  getNextSeat
}: AdvanceTrickParams<SeatId>): AdvanceTrickResult<SeatId> {
  if (combo.type === ComboType.PASS) {
    if (!state.lastCombo) {
      return { ok: false, reason: 'cannot-pass-when-leading' };
    }
    const passCount = state.passCountSinceLastPlay + 1;
    if (passCount >= 2 && state.lastSeatId !== null && state.lastSeatId !== undefined) {
      return {
        ok: true,
        trickEnded: true,
        nextSeatId: state.lastSeatId,
        state: { lastCombo: null, lastSeatId: null, passCountSinceLastPlay: 0 }
      };
    }
    return {
      ok: true,
      trickEnded: false,
      nextSeatId: getNextSeat(seatId),
      state: { ...state, passCountSinceLastPlay: passCount }
    };
  }

  return {
    ok: true,
    trickEnded: false,
    nextSeatId: getNextSeat(seatId),
    state: { lastCombo: combo, lastSeatId: seatId, passCountSinceLastPlay: 0 }
  };
}
