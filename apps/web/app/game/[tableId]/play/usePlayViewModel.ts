'use client';

import { useMemo } from 'react';

import type { Card } from '@poker/core-cards';
import type { CardRowSelectionMode } from '@poker/ui-cards';
import type { Combo, ComboType, PlayValidator } from '@game-core/doudizhu';
import type { GameSnapshot } from '@shared/messages';
import type { TablePhaseStatus } from '@shared/tablePhases';

import type { GameTableSeat } from '../../../../components/poker/GameTable';

type BidOption = {
  label: string;
  value: number;
  variant?: 'secondary' | 'ghost';
  blocked?: boolean;
};

type DoubleOption = {
  label: string;
  value: boolean;
  variant?: 'secondary' | 'ghost';
};

export type ActionState =
  | {
      stage: 'bidding';
      options: BidOption[];
      disabled: boolean;
      onSelect: (bid: number) => void;
    }
  | {
      stage: 'doubling';
      options: DoubleOption[];
      disabled: boolean;
      onSelect: (value: boolean) => void;
    }
  | {
      stage: 'playing';
      comboLabel: string;
      canPass: boolean;
      canPlay: boolean;
      onPlay: () => void;
      onPass: () => void;
    }
  | {
      stage: 'waiting';
      label: string;
    };

type SelectedValidation = {
  ok: boolean;
  reason: string | null;
  combo: Combo | null;
};

type UsePlayViewModelArgs = {
  snapshot: GameSnapshot | null;
  selfSeatId: string | null;
  selfHand: Card[];
  selectedHandIds: number[];
  tablePhaseStatus: TablePhaseStatus;
  validator: PlayValidator;
  sendBid: (bid: number) => void;
  sendDouble: (value: boolean) => void;
  sendPlay: (cardIds: number[]) => void;
};

export type PlayViewModel = {
  tablePlayers: GameTableSeat[];
  phaseLabel: string;
  actionState: ActionState | null;
  callScoreLabel?: string;
  deckCountLabel?: string;
  currentTurnLabel?: string;
  landlordSeatId?: string;
  handSelectionMode: CardRowSelectionMode;
};

export function usePlayViewModel({
  snapshot,
  selfSeatId,
  selfHand,
  selectedHandIds,
  tablePhaseStatus,
  validator,
  sendBid,
  sendDouble,
  sendPlay
}: UsePlayViewModelArgs): PlayViewModel {
  const trickCombosBySeat = useMemo(() => {
    const combos = snapshot?.trickCombos;
    if (!combos || snapshot?.phase !== 'playing') {
      return {};
    }
    return Object.fromEntries(
      Object.entries(combos).map(([seatId, combo]) => [seatId, combo.cards.map(card => ({ ...card, faceUp: true }))])
    );
  }, [snapshot?.phase, snapshot?.trickCombos]);

  const currentTurnSeatId = useMemo(() => {
    if (!snapshot) return null;
    return snapshot.currentTurnSeatId ?? snapshot.bidding?.currentSeatId ?? snapshot.lastDealtSeatId ?? null;
  }, [snapshot]);

  const currentTurnSeat = useMemo(() => {
    if (!snapshot || !currentTurnSeatId) return null;
    return snapshot.seats.find(seat => seat.seatId === currentTurnSeatId) ?? null;
  }, [currentTurnSeatId, snapshot]);

  const tablePlayers = useMemo(() => {
    if (!snapshot) return [];
    return rotateSeats(
      snapshot.seats.map(seat => {
        let status: string;
        if (tablePhaseStatus === 'complete') {
          status = '等待下一局';
        } else if (snapshot.lastDealtSeatId === seat.seatId) {
          status = '发牌中…';
        } else if (seat.handCount > 0) {
          status = `持有 ${seat.handCount} 张`;
        } else if (tablePhaseStatus === 'dealing') {
          status = '等待发牌';
        } else {
          status = '等待开局';
        }
        const isCurrentTurn = currentTurnSeatId === seat.seatId;
        const isLandlord = snapshot.landlordSeatId === seat.seatId;
        return {
          id: seat.seatId,
          nickname: seat.nickname,
          avatar: seat.avatar,
          avatarUrl: `/avatars/${seat.avatar}`,
          cards: trickCombosBySeat[seat.seatId] ?? undefined,
          status: [
            seat.isHost ? `${status} · 房主` : status,
            isCurrentTurn ? '当前行动' : null,
            isLandlord ? '地主' : null
          ]
            .filter(Boolean)
            .join(' · ')
        };
      }),
      selfSeatId
    );
  }, [currentTurnSeatId, snapshot, selfSeatId, tablePhaseStatus, trickCombosBySeat]);

  const phaseLabel = useMemo(() => {
    switch (tablePhaseStatus) {
      case 'dealing':
        return '发牌阶段';
      case 'bidding':
        return '叫分阶段';
      case 'doubling':
        return '加倍阶段';
      case 'playing':
        return '出牌阶段';
      case 'complete':
        return '本局结束';
      default:
        return '等待开始';
    }
  }, [tablePhaseStatus]);

  const prevCombo = useMemo<Combo | null>(() => {
    if (!snapshot?.lastCombo) return null;
    return {
      type: snapshot.lastCombo.type as ComboType,
      cards: snapshot.lastCombo.cards,
      mainRank: snapshot.lastCombo.mainRank as number | undefined,
      length: snapshot.lastCombo.length
    } as Combo;
  }, [snapshot?.lastCombo]);

  const selectedCards = useMemo(() => {
    const idSet = new Set(selectedHandIds);
    return selfHand.filter(card => idSet.has(card.id));
  }, [selectedHandIds, selfHand]);

  const selectedValidation: SelectedValidation = useMemo(() => {
    if (!selectedCards.length) {
      return { ok: false, reason: 'no-cards', combo: null };
    }
    if (tablePhaseStatus !== 'playing') {
      return { ok: false, reason: 'not-playing', combo: null };
    }
    const classified = validator.classify(selectedCards);
    if (!classified) {
      return { ok: false, reason: 'invalid-combo', combo: null };
    }
    if (prevCombo) {
      const follow = validator.validateFollow(selectedCards, prevCombo);
      return follow.ok
        ? { ok: true, reason: null, combo: classified }
        : { ok: false, reason: follow.reason ?? 'does-not-beat', combo: classified };
    }
    const lead = validator.validateLead(selectedCards);
    return lead.ok
      ? { ok: true, reason: null, combo: classified }
      : { ok: false, reason: lead.reason ?? 'invalid-combo', combo: classified };
  }, [prevCombo, selectedCards, tablePhaseStatus, validator]);

  const highestBid = snapshot?.bidding?.highestBid ?? 0;
  const isBiddingPhase = tablePhaseStatus === 'bidding';
  const isDoublingPhase = tablePhaseStatus === 'doubling';
  const isMyTurn = !!selfSeatId && currentTurnSeatId === selfSeatId;

  const actionState = useMemo<ActionState | null>(() => {
    if (tablePhaseStatus === 'dealing') {
      return null;
    }
    if (isBiddingPhase) {
      const baseBidOptions: BidOption[] = [
        { label: isMyTurn ? '不叫' : '等待轮到你…', value: 0, variant: isMyTurn ? 'ghost' : undefined },
        { label: '1 分', value: 1 },
        { label: '2 分', value: 2, variant: 'secondary' },
        { label: '3 分', value: 3, variant: 'secondary' }
      ];
      const bidOptions = baseBidOptions.map(option => ({
        ...option,
        blocked: option.value !== 0 && option.value <= highestBid
      }));
      return { stage: 'bidding', options: bidOptions, disabled: !isMyTurn, onSelect: sendBid };
    }
    if (isDoublingPhase) {
      const disabled = !isMyTurn;
      const landlordSeatId = snapshot?.landlordSeatId;
      const isSelfLandlord = Boolean(landlordSeatId && landlordSeatId === selfSeatId);
      let options: DoubleOption[];
      if (isSelfLandlord) {
        options = [
          { label: disabled ? '等待地主决定…' : '不再加倍', value: false, variant: 'ghost' },
          { label: '再加倍', value: true, variant: 'secondary' }
        ];
      } else {
        options = [
          { label: disabled ? '等待轮到你…' : '不加倍', value: false, variant: 'ghost' },
          { label: '加倍', value: true, variant: 'secondary' }
        ];
      }
      return { stage: 'doubling', options, disabled, onSelect: sendDouble };
    }
    if (tablePhaseStatus === 'playing') {
      if (!isMyTurn) {
        return null;
      }
      const comboLabel = selectedValidation.combo?.type
        ? `已选牌型：${selectedValidation.combo.type}`
        : '请选择合法牌型';
      return {
        stage: 'playing',
        comboLabel,
        canPass: Boolean(prevCombo),
        canPlay: selectedValidation.ok,
        onPlay: () => sendPlay(selectedHandIds),
        onPass: () => sendPlay([])
      };
    }
    const label = tablePhaseStatus === 'complete' ? '等待下一局' : '等待开始';
    return { stage: 'waiting', label };
  }, [
    isBiddingPhase,
    isDoublingPhase,
    tablePhaseStatus,
    isMyTurn,
    highestBid,
    snapshot?.landlordSeatId,
    selfSeatId,
    sendBid,
    sendDouble,
    sendPlay,
    selectedHandIds,
    selectedValidation.combo?.type,
    selectedValidation.ok,
    prevCombo
  ]);

  const callScoreLabel = snapshot?.callScore != null ? String(snapshot.callScore) : undefined;
  const deckCountLabel = snapshot ? String(snapshot.deckCount) : undefined;

  const handSelectionMode: CardRowSelectionMode = tablePhaseStatus === 'playing' ? 'multiple' : 'none';

  return {
    tablePlayers,
    phaseLabel,
    actionState,
    callScoreLabel,
    deckCountLabel,
    currentTurnLabel: currentTurnSeat?.nickname ?? undefined,
    landlordSeatId: snapshot?.landlordSeatId ?? undefined,
    handSelectionMode
  };
}

function rotateSeats(players: GameTableSeat[], selfSeatId: string | null) {
  if (!selfSeatId || players.length === 0) {
    return players;
  }
  const currentIndex = players.findIndex(player => player.id === selfSeatId);
  if (currentIndex === -1) {
    return players;
  }
  const targetIndex = Math.floor(players.length / 2);
  const offset = (targetIndex - currentIndex + players.length) % players.length;
  return players.map((_, index) => players[(index - offset + players.length) % players.length]);
}
