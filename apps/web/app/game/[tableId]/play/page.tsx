'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { GameTableStage } from '../../../../components/poker/GameTableStage';
import { usePlaySession } from '../../../../hooks/usePlaySession';
import { createPlayValidator } from '@game-core/doudizhu';
import { ActionControls } from './ActionControls';
import { usePlayViewModel } from './usePlayViewModel';

type PlayPageProps = {
  params: { tableId: string };
};

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

  const handleExitGame = useCallback(() => {
    exitGame(() => router.push('/lobby'));
  }, [exitGame, router]);

  const viewModel = usePlayViewModel({
    snapshot,
    selfHand,
    selfSeatId,
    selectedHandIds,
    tablePhaseStatus,
    validator,
    sendBid,
    sendDouble,
    sendPlay
  });

  const handActionButton = <ActionControls actionState={viewModel.actionState} />;

  return (
    <GameTableStage
      players={viewModel.tablePlayers}
      handCards={selfHand}
      dealingCards={dealingFlights}
      onDealingCardComplete={handleDealingComplete}
      onLeave={handleExitGame}
      handActionButton={handActionButton}
      phaseLabel={viewModel.phaseLabel}
      callScoreLabel={viewModel.callScoreLabel}
      deckCountLabel={viewModel.deckCountLabel}
      currentTurnLabel={viewModel.currentTurnLabel}
      landlordSeatId={viewModel.landlordSeatId}
      handSelectionMode={viewModel.handSelectionMode}
      selectedHandIds={selectedHandIds}
      onHandSelectionChange={setSelectedHandIds}
    />
  );
}
