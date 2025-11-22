'use client';

import { useCallback, useMemo, type ReactNode } from 'react';

import type { Card, Rank } from '@poker/core-cards';
import { RANKS } from '@poker/core-cards';

import { GameTable, type GameTableProps } from './GameTable';

import styles from './GameTableStage.module.css';

type HandGrouping = 'byColor' | 'bySuit';

export type GameTableStageProps = GameTableProps & {
  actions?: ReactNode;
  handCards?: Card[];
  handGrouping?: HandGrouping;
  onLeave?: () => void;
  leaveConfirmMessage?: string;
  leaveLabel?: string;
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
  actions,
  handCards,
  handGrouping = 'byColor',
  handCardRows,
  handCardRowGap = 0,
  handCardRowOverlap = 40,
  onLeave,
  leaveConfirmMessage = '确定要离开牌局吗？',
  leaveLabel = '离开牌局',
  ...gameTableProps
}: GameTableStageProps) {
  const resolvedHandCardRows = useMemo(
    () => handCardRows ?? deriveHandRows(handCards, handGrouping),
    [handCardRows, handCards, handGrouping]
  );

  const handleLeave = useCallback(() => {
    if (!onLeave) return;
    const confirmed =
      typeof window === 'undefined' || !leaveConfirmMessage
        ? true
        : window.confirm(leaveConfirmMessage);
    if (confirmed) {
      onLeave();
    }
  }, [leaveConfirmMessage, onLeave]);

  const hasActions = Boolean(actions || onLeave);

  return (
    <div className={styles.stageShell}>
      {hasActions ? (
        <div className={styles.actions}>
          <div className={styles.actionsInner}>
            {actions}
            {onLeave ? (
              <button
                type="button"
                onClick={handleLeave}
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
            ) : null}
          </div>
        </div>
      ) : null}
      <GameTable
        handCardRowGap={handCardRowGap}
        handCardRowOverlap={handCardRowOverlap}
        handCardRows={resolvedHandCardRows}
        {...gameTableProps}
      />
    </div>
  );
}
