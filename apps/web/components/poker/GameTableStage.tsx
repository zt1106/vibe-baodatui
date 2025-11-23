'use client';

import { useCallback, useMemo, useState } from 'react';

import type { Card, Rank } from '@poker/core-cards';

import { GameTable, type GameTableProps } from './GameTable';
import type { CardRowSelectionMode } from '@poker/ui-cards';
import stageStyles from './GameTableStage.module.css';

export type GameTableStageProps = GameTableProps & {
  handCards?: Card[];
  onLeave?: () => void;
  leaveConfirmMessage?: string;
  leaveLabel?: string;
  onUserAction?: () => void;
  userActionLabel?: string;
  phaseLabel?: string;
  callScoreLabel?: string;
  deckCountLabel?: string;
  currentTurnLabel?: string;
  landlordSeatId?: string;
  handSelectionMode?: CardRowSelectionMode;
  selectedHandIds?: number[];
  onHandSelectionChange?: (ids: number[]) => void;
};

// Dou Dizhu display order, highest to lowest
const HAND_RANK_DISPLAY_ORDER: Rank[] = [
  'Joker',
  '2',
  'A',
  'K',
  'Q',
  'J',
  '10',
  '9',
  '8',
  '7',
  '6',
  '5',
  '4',
  '3'
];
const HAND_RANK_ORDER: Record<Rank, number> = Object.fromEntries(
  HAND_RANK_DISPLAY_ORDER.map((rank, index) => [rank, index])
) as Record<Rank, number>;
const HAND_SUIT_ORDER: Record<Card['suit'], number> = {
  JR: 0, // red joker first
  JB: 1,
  S: 0,
  H: 1,
  D: 2,
  C: 3
};

function sortHandRow(cards: Card[]) {
  return [...cards].sort((a, b) => {
    const rankDiff = (HAND_RANK_ORDER[a.rank] ?? Number.MAX_SAFE_INTEGER) - (HAND_RANK_ORDER[b.rank] ?? Number.MAX_SAFE_INTEGER);
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return (HAND_SUIT_ORDER[a.suit] ?? 0) - (HAND_SUIT_ORDER[b.suit] ?? 0);
  });
}

function deriveHandRows(handCards: Card[] | undefined) {
  if (!handCards || handCards.length === 0) {
    return [];
  }
  return [sortHandRow(handCards)];
}

export function GameTableStage({
  handCards,
  handCardRows,
  handCardRowGap = 0,
  handCardRowOverlap = 40,
  phaseLabel,
  callScoreLabel,
  deckCountLabel,
  currentTurnLabel,
  landlordSeatId,
  handSelectionMode,
  selectedHandIds,
  onHandSelectionChange,
  onLeave,
  leaveConfirmMessage = '确定要离开牌局吗？',
  leaveLabel = '离开牌局',
  onUserAction,
  userActionLabel = '开始行动',
  handActionButton,
  ...gameTableProps
}: GameTableStageProps) {
  const resolvedHandCardRows = useMemo(
    () => handCardRows ?? deriveHandRows(handCards),
    [handCardRows, handCards]
  );

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const handleLeaveRequest = useCallback(() => {
    if (!onLeave) return;
    setShowLeaveConfirm(true);
  }, [onLeave]);

  const handleLeaveConfirm = useCallback(() => {
    if (!onLeave) return;
    setShowLeaveConfirm(false);
    onLeave();
  }, [onLeave]);

  const handleLeaveCancel = useCallback(() => {
    setShowLeaveConfirm(false);
  }, []);

  const topBarActions = useMemo(() => {
    if (!onLeave) return null;
    return (
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center'
        }}
      >
        <button
          type="button"
          onClick={handleLeaveRequest}
          style={{
            padding: '0.28rem 0.65rem',
            borderRadius: 8,
            border: '1px solid rgba(248, 113, 113, 0.6)',
            background: 'transparent',
            color: '#fecaca',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            boxShadow: '0 10px 20px rgba(2, 6, 23, 0.55)',
            backdropFilter: 'blur(6px)'
          }}
        >
          {leaveLabel}
        </button>
        {showLeaveConfirm ? (
          <div
            style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              minWidth: 180,
              padding: '0.75rem 0.75rem 0.5rem',
              borderRadius: 12,
              background: 'rgba(15,23,42,0.92)',
              border: '1px solid rgba(148,163,184,0.25)',
              boxShadow: '0 12px 26px rgba(0,0,0,0.45)',
              color: '#e2e8f0',
              zIndex: 10
            }}
          >
            <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', lineHeight: 1.5 }}>
              {leaveConfirmMessage}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={handleLeaveCancel}
                style={{
                  padding: '0.32rem 0.65rem',
                  borderRadius: 8,
                  border: '1px solid rgba(148,163,184,0.4)',
                  background: 'rgba(15,23,42,0.8)',
                  color: '#cbd5e1',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleLeaveConfirm}
                style={{
                  padding: '0.32rem 0.65rem',
                  borderRadius: 8,
                  border: '1px solid rgba(248, 113, 113, 0.6)',
                  background: 'rgba(248, 113, 113, 0.1)',
                  color: '#fecaca',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                确定
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }, [handleLeaveCancel, handleLeaveConfirm, handleLeaveRequest, leaveConfirmMessage, leaveLabel, onLeave, showLeaveConfirm]);

  const resolvedHandActionButton = useMemo(() => {
    if (handActionButton !== undefined) {
      return handActionButton;
    }
    return (
      <button type="button" onClick={onUserAction} className={stageStyles.actionButton}>
        <span className={stageStyles.actionButtonLabel}>{userActionLabel}</span>
      </button>
    );
  }, [handActionButton, onUserAction, userActionLabel]);

  return (
    <GameTable
      handCardRowGap={handCardRowGap}
      handCardRowOverlap={handCardRowOverlap}
      handCardRows={resolvedHandCardRows}
      topBarActions={topBarActions}
      handActionButton={resolvedHandActionButton}
      phaseLabel={phaseLabel}
      callScoreLabel={callScoreLabel}
      deckCountLabel={deckCountLabel}
      currentTurnLabel={currentTurnLabel}
      landlordSeatId={landlordSeatId}
      handSelectionMode={handSelectionMode}
      selectedHandIds={selectedHandIds}
      onHandSelectionChange={onHandSelectionChange}
      {...gameTableProps}
    />
  );
}
