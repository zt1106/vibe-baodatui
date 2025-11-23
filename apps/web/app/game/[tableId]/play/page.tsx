'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { GameTableStage } from '../../../../components/poker/GameTableStage';
import { type GameTableSeat } from '../../../../components/poker/GameTable';
import { usePlaySession } from '../../../../hooks/usePlaySession';

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

  const {
    snapshot,
    selfHand,
    selfSeatId,
    dealingFlights,
    tablePhaseStatus,
    handleDealingComplete,
    exitGame
  } =
    usePlaySession(tableId, {
      onGameEnded: handleGameEnded,
      onKicked: handleKicked
    });

  const tablePlayers = useMemo(() => {
    if (!snapshot) return [];
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
        return {
          id: seat.seatId,
          nickname: seat.nickname,
          avatar: seat.avatar,
          avatarUrl: `/avatars/${seat.avatar}`,
          status: seat.isHost ? `${status} · 房主` : status
        };
      }),
      selfSeatId
    );
  }, [snapshot, selfSeatId, tablePhaseStatus]);

  const handleExitGame = useCallback(() => {
    exitGame(() => router.push('/lobby'));
  }, [exitGame, router]);

  return (
    <GameTableStage
      players={tablePlayers}
      handCards={selfHand}
      dealingCards={dealingFlights}
      onDealingCardComplete={handleDealingComplete}
      onLeave={handleExitGame}
    />
  );
}
