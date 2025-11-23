'use client';

import { useCallback, useMemo, useState } from 'react';

import type { Card, Rank } from '@poker/core-cards';
import { RANKS } from '@poker/core-cards';

import { GameTable, type GameTableProps } from './GameTable';
import type { CardRowSelectionMode } from '@poker/ui-cards';
import stageStyles from './GameTableStage.module.css';

type HandGrouping = 'byColor' | 'bySuit';

export type GameTableStageProps = GameTableProps & {
  handCards?: Card[];
  handGrouping?: HandGrouping;
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

const SUIT_DISPLAY_ORDER: Array<'S' | 'H' | 'D' | 'C'> = ['S', 'H', 'D', 'C'];
const RANK_ORDER: Record<Rank, number> = Object.fromEntries(
  RANKS.map((rank, index) => [rank, index])
) as Record<Rank, number>;

function sortRow(row: Card[]) {
  return row.slice().sort((a, b) => {
    const aOrder = RANK_ORDER[a.rank] ?? 0;
    const bOrder = RANK_ORDER[b.rank] ?? 0;
    return aOrder - bOrder;
  });
}

function groupHandBySuit(cards: Card[]) {
  const suits: Record<'S' | 'H' | 'D' | 'C' | 'J', Card[]> = {
    S: [],
    H: [],
    D: [],
    C: [],
    J: []
  };
  for (const card of cards) {
    if (card.rank === 'Joker' || card.suit === 'JB' || card.suit === 'JR') {
      suits.J.push(card);
      continue;
    }
    if (suits[card.suit as 'S' | 'H' | 'D' | 'C']) {
      suits[card.suit as 'S' | 'H' | 'D' | 'C'].push(card);
    }
  }
  const rows: Card[][] = [];
  for (const suit of SUIT_DISPLAY_ORDER) {
    if (suits[suit].length > 0) {
      rows.push(sortRow(suits[suit]));
    }
  }
  if (suits.J.length > 0) {
    rows.push(sortRow(suits.J));
  }
  return rows;
}

function groupHandByColor(cards: Card[]) {
  const rows: Card[][] = [[], []];
  for (const card of cards) {
    const { suit } = card;
    const isRed = suit === 'H' || suit === 'D' || suit === 'JR';
    const isBlack = suit === 'S' || suit === 'C' || suit === 'JB';
    if (isRed) {
      rows[0].push(card);
    } else if (isBlack) {
      rows[1].push(card);
    }
  }
  return rows.map(sortRow).filter(row => row.length > 0);
}

function deriveHandRows(handCards: Card[] | undefined, handGrouping: HandGrouping) {
  if (!handCards || handCards.length === 0) {
    return [];
  }
  return handGrouping === 'bySuit' ? groupHandBySuit(handCards) : groupHandByColor(handCards);
}

export function GameTableStage({
  handCards,
  handGrouping = 'byColor',
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
    () => handCardRows ?? deriveHandRows(handCards, handGrouping),
    [handCardRows, handCards, handGrouping]
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
