'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { GameTableStage } from '../../../../components/poker/GameTableStage';
import { type GameTableSeat } from '../../../../components/poker/GameTable';
import { usePlaySession } from '../../../../hooks/usePlaySession';
import stageStyles from '../../../../components/poker/GameTableStage.module.css';
import { createPlayValidator, ComboType, type Combo } from '@game-core/doudizhu';

type PlayPageProps = {
  params: { tableId: string };
};

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

export default function PlayPage({ params }: PlayPageProps) {
  const tableId = decodeURIComponent(params.tableId ?? '');
  const router = useRouter();
  const handleGameEnded = useCallback(() => {
    setTimeout(() => {
      router.push(`/game/${encodeURIComponent(tableId)}/prepare`);
    }, 400);
  }, [router, tableId]);

  const handleKicked = useCallback(() => {
    setTimeout(() => {
      router.push('/lobby');
    }, 1200);
  }, [router]);

  const [selectedHandIds, setSelectedHandIds] = useState<number[]>([]);
  const validator = useMemo(() => createPlayValidator(), []);

  const {
    snapshot,
    selfHand,
    selfSeatId,
    dealingFlights,
    tablePhaseStatus,
    handleDealingComplete,
    exitGame,
    sendBid,
    sendDouble,
    sendPlay
  } =
    usePlaySession(tableId, {
      onGameEnded: handleGameEnded,
      onKicked: handleKicked
    });

  useEffect(() => {
    setSelectedHandIds(ids => {
      if (!ids.length) return ids;
      const available = new Set(selfHand.map(card => card.id));
      return ids.filter(id => available.has(id));
    });
  }, [selfHand]);

  const currentTurnSeatId = useMemo(() => {
    if (!snapshot) return null;
    return snapshot.currentTurnSeatId ?? snapshot.bidding?.currentSeatId ?? snapshot.lastDealtSeatId ?? null;
  }, [snapshot]);

  const currentTurnSeat = useMemo(() => {
    if (!snapshot || !currentTurnSeatId) return null;
    return snapshot.seats.find(seat => seat.seatId === currentTurnSeatId) ?? null;
  }, [currentTurnSeatId, snapshot]);

  const biddingState = snapshot?.bidding;
  const highestBid = biddingState?.highestBid ?? 0;
  const isBiddingPhase = tablePhaseStatus === 'bidding';
  const isDoublingPhase = tablePhaseStatus === 'doubling';
  const isMyTurn = !!selfSeatId && currentTurnSeatId === selfSeatId;
  const isLandlord = selfSeatId && snapshot?.landlordSeatId === selfSeatId;
  const selectedCards = useMemo(() => {
    const idSet = new Set(selectedHandIds);
    return selfHand.filter(card => idSet.has(card.id));
  }, [selectedHandIds, selfHand]);

  const tablePlayers = useMemo(() => {
    if (!snapshot) return [];
    const lastCombo = snapshot.lastCombo;
    return rotateSeats(
      snapshot.seats.map(seat => {
        const status =
          tablePhaseStatus === 'complete'
            ? '等待下一局'
            : snapshot.lastDealtSeatId === seat.seatId
            ? '发牌中…'
            : seat.handCount > 0
            ? `持有 ${seat.handCount} 张`
            : tablePhaseStatus === 'dealing'
            ? '等待发牌'
            : '等待开局';
        const isCurrentTurn = currentTurnSeatId === seat.seatId;
        const isLandlord = snapshot.landlordSeatId === seat.seatId;
        return {
          id: seat.seatId,
          nickname: seat.nickname,
          avatar: seat.avatar,
          avatarUrl: `/avatars/${seat.avatar}`,
          cards: lastCombo && lastCombo.seatId === seat.seatId ? lastCombo.cards : undefined,
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
  }, [currentTurnSeatId, snapshot, selfSeatId, tablePhaseStatus]);

  const handleExitGame = useCallback(() => {
    exitGame(() => router.push('/lobby'));
  }, [exitGame, router]);

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

  const prevCombo = useMemo(() => {
    if (!snapshot?.lastCombo) return null;
    return {
      type: snapshot.lastCombo.type as ComboType,
      cards: snapshot.lastCombo.cards,
      mainRank: snapshot.lastCombo.mainRank as number | undefined,
      length: snapshot.lastCombo.length
    } as Combo;
  }, [snapshot?.lastCombo]);

  const selectedValidation = useMemo(() => {
    if (!selectedCards.length) return { ok: false, reason: 'no-cards', combo: null };
    if (tablePhaseStatus !== 'playing') {
      return { ok: false, reason: 'not-playing', combo: null };
    }
    const classified = validator.classify(selectedCards);
    if (!classified) {
      return { ok: false, reason: 'invalid-combo', combo: null };
    }
    if (prevCombo) {
      const follow = validator.validateFollow(selectedCards, prevCombo);
      return follow.ok ? { ok: true, reason: null, combo: classified } : { ok: false, reason: follow.reason ?? 'does-not-beat', combo: classified };
    }
    const lead = validator.validateLead(selectedCards);
    return lead.ok ? { ok: true, reason: null, combo: classified } : { ok: false, reason: lead.reason ?? 'invalid-combo', combo: classified };
  }, [prevCombo, selectedCards, tablePhaseStatus, validator]);

  const handActionButton = useMemo(() => {
    if (tablePhaseStatus === 'dealing') {
      return null;
    }
    if (isBiddingPhase) {
      const bidOptions: Array<{ label: string; value: number; variant?: 'secondary' | 'ghost' }> = [
        { label: isMyTurn ? '不叫' : '等待轮到你…', value: 0, variant: isMyTurn ? 'ghost' : undefined },
        { label: '1 分', value: 1 },
        { label: '2 分', value: 2, variant: 'secondary' },
        { label: '3 分', value: 3, variant: 'secondary' }
      ];
      const disabled = !isMyTurn;
      return (
        <div className={stageStyles.actionGroup}>
          {bidOptions.map(option => {
            const blocked = option.value !== 0 && option.value <= highestBid;
            const classNames = [
              stageStyles.actionButton,
              option.variant === 'secondary' ? stageStyles.secondaryAction : '',
              option.variant === 'ghost' ? stageStyles.ghostAction : ''
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={option.value}
                type="button"
                className={classNames}
                disabled={disabled || blocked}
                onClick={() => sendBid(option.value)}
              >
                <span className={stageStyles.actionButtonLabel}>
                  {blocked ? `${option.label}（已叫）` : option.label}
                </span>
              </button>
            );
          })}
        </div>
      );
    }
    if (isDoublingPhase) {
      const disabled = !isMyTurn;
      const landlordSeatId = snapshot?.landlordSeatId;
      const isSelfLandlord = landlordSeatId && landlordSeatId === selfSeatId;
      const options: Array<{ label: string; value: boolean; variant?: 'secondary' | 'ghost' }> = isSelfLandlord
        ? [
            { label: disabled ? '等待地主决定…' : '不再加倍', value: false, variant: 'ghost' },
            { label: '再加倍', value: true, variant: 'secondary' }
          ]
        : [
            { label: disabled ? '等待轮到你…' : '不加倍', value: false, variant: 'ghost' },
            { label: '加倍', value: true, variant: 'secondary' }
          ];
      return (
        <div className={stageStyles.actionGroup}>
          {options.map(option => {
            const classNames = [
              stageStyles.actionButton,
              option.variant === 'secondary' ? stageStyles.secondaryAction : '',
              option.variant === 'ghost' ? stageStyles.ghostAction : ''
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={option.label}
                type="button"
                className={classNames}
                disabled={disabled}
                onClick={() => sendDouble(option.value)}
              >
                <span className={stageStyles.actionButtonLabel}>{option.label}</span>
              </button>
            );
          })}
        </div>
      );
    }
    if (tablePhaseStatus === 'playing') {
      if (!isMyTurn) {
        return null;
      }
      const canPass = Boolean(prevCombo);
      const canPlay = selectedValidation.ok;
      const comboLabel = selectedValidation.combo?.type
        ? `已选牌型：${selectedValidation.combo.type}`
        : '请选择合法牌型';
      return (
        <div className={stageStyles.actionGroup} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ color: '#e2e8f0', fontWeight: 700, textAlign: 'center', marginBottom: 6, minHeight: 20 }}>
            {comboLabel}
          </div>
          <div className={stageStyles.actionGroup}>
            {canPass ? (
              <button
                type="button"
                className={`${stageStyles.actionButton} ${stageStyles.ghostAction}`}
                onClick={() => sendPlay([])}
              >
                <span className={stageStyles.actionButtonLabel}>不出</span>
              </button>
            ) : null}
            <button
              type="button"
              className={stageStyles.actionButton}
              disabled={!canPlay}
              onClick={() => sendPlay(selectedHandIds)}
            >
              <span className={stageStyles.actionButtonLabel}>出牌</span>
            </button>
          </div>
        </div>
      );
    }

    const label =
      tablePhaseStatus === 'complete'
        ? '等待下一局'
        : '等待开始';
    return (
      <button type="button" className={stageStyles.actionButton} disabled>
        <span className={stageStyles.actionButtonLabel}>{label}</span>
      </button>
    );
  }, [
    highestBid,
    isBiddingPhase,
    isDoublingPhase,
    isMyTurn,
    prevCombo,
    selectedHandIds,
    selectedValidation.combo?.type,
    selectedValidation.ok,
    sendBid,
    sendDouble,
    sendPlay,
    snapshot?.landlordSeatId,
    tablePhaseStatus
  ]);

  return (
    <GameTableStage
      players={tablePlayers}
      handCards={selfHand}
      dealingCards={dealingFlights}
      onDealingCardComplete={handleDealingComplete}
      onLeave={handleExitGame}
      handActionButton={handActionButton}
      phaseLabel={phaseLabel}
      callScoreLabel={snapshot?.callScore != null ? String(snapshot.callScore) : undefined}
      deckCountLabel={snapshot ? String(snapshot.deckCount) : undefined}
      currentTurnLabel={currentTurnSeat?.nickname}
      landlordSeatId={snapshot?.landlordSeatId ?? undefined}
      handSelectionMode={tablePhaseStatus === 'playing' ? 'multiple' : 'none'}
      selectedHandIds={selectedHandIds}
      onHandSelectionChange={setSelectedHandIds}
    />
  );
}
