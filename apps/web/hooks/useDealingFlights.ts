import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createCardId } from '@poker/core-cards';

import type { DealingCardFlight } from '../components/poker/GameTable';
import type { GameSnapshot } from '@shared/messages';

type UseDealingFlightsOptions = {
  resetKey: string;
  selfSeatId: string | null;
  snapshot: GameSnapshot | null;
};

export function useDealingFlights({ resetKey, selfSeatId, snapshot }: UseDealingFlightsOptions) {
  const [dealingFlights, setDealingFlights] = useState<DealingCardFlight[]>([]);
  const lastSnapshotRef = useRef<GameSnapshot | null>(null);
  const dealSeqRef = useRef(0);

  const dealingCardIds = useMemo(
    () => [
      createCardId('A', 'S'),
      createCardId('K', 'H'),
      createCardId('Q', 'C'),
      createCardId('J', 'D'),
      createCardId('10', 'S'),
      createCardId('9', 'H')
    ],
    []
  );

  useEffect(() => {
    setDealingFlights([]);
    lastSnapshotRef.current = null;
    dealSeqRef.current = 0;
  }, [resetKey]);

  useEffect(() => {
    if (!snapshot) {
      lastSnapshotRef.current = snapshot;
      setDealingFlights([]);
      dealSeqRef.current = 0;
      return;
    }
    const prev = lastSnapshotRef.current;
    if (!prev) {
      lastSnapshotRef.current = snapshot;
      return;
    }
    const prevHandCounts = new Map(prev.seats.map(seat => [seat.seatId, seat.handCount]));
    const updates: DealingCardFlight[] = [];
    for (const seat of snapshot.seats) {
      if (seat.seatId === selfSeatId) {
        continue;
      }
      const prevCount = prevHandCounts.get(seat.seatId) ?? 0;
      const delta = seat.handCount - prevCount;
      if (delta <= 0) {
        continue;
      }
      for (let i = 0; i < delta; i += 1) {
        const seq = dealSeqRef.current++;
        const cardId = dealingCardIds[seq % dealingCardIds.length];
        updates.push({
          id: `deal-${seq}-${seat.seatId}`,
          seatId: seat.seatId,
          cardId,
          faceUp: false
        });
      }
    }
    if (updates.length) {
      setDealingFlights(prevFlights => [...prevFlights, ...updates]);
    }
    lastSnapshotRef.current = snapshot;
  }, [dealingCardIds, selfSeatId, snapshot]);

  const handleDealingComplete = useCallback((flightId: string) => {
    setDealingFlights(prev => prev.filter(flight => flight.id !== flightId));
  }, []);

  return { dealingFlights, handleDealingComplete };
}
