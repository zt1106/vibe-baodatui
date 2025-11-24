'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import type { Card } from '@poker/core-cards';
import { type GameSnapshot } from '@shared/messages';
import { derivePhaseStatus, initialTablePhase, tablePhaseReducer } from '@shared/tablePhases';

import { hydrateSharedHand, subscribeToHandUpdates } from '../lib/tableSocket';
import { useApiBaseUrl } from './useApiBaseUrl';
import { useDealingFlights } from './useDealingFlights';
import { usePlaySessionAuth } from './usePlaySessionAuth';
import { useStoredNickname } from './useStoredNickname';
import { useTableSocket } from './useTableSocket';

type TableSocket = ReturnType<typeof import('../lib/tableSocket').acquireTableSocket>;
type AckResult = { ok: boolean; message?: string };

type UsePlaySessionOptions = {
  onGameEnded?: (tableId: string) => void;
  onKicked?: (tableId: string) => void;
};

export function usePlaySession(tableId: string, options: UsePlaySessionOptions = {}) {
  const apiBaseUrl = useApiBaseUrl();
  const { persistNickname } = useStoredNickname();
  const { user, authStatus, authError } = usePlaySessionAuth({ apiBaseUrl, persistNickname, tableId });
  const [gameError, setGameError] = useState<string | null>(null);
  const { tablePhase, tablePhaseStatus, syncPhaseFromSnapshot, resetPhase } = useTablePhaseController(tableId);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const { selfHand, setSelfHand } = useSelfHandState(tableId);

  useEffect(() => {
    setGameError(null);
    setSnapshot(null);
    resetPhase();
  }, [resetPhase, tableId]);

  const { socketRef, releaseSocket } = useTableSocket({
    apiBaseUrl,
    tableId,
    user,
    authStatus,
    syncPhaseFromSnapshot,
    setSnapshot,
    setSelfHand,
    setGameError,
    onGameEnded: options.onGameEnded,
    onKicked: options.onKicked,
    resetPhase
  });

  const selfSeatId = useMemo(() => {
    if (!snapshot || !user) return null;
    const seat = snapshot.seats.find(entry => entry.userId === user.id);
    return seat?.seatId ?? null;
  }, [snapshot, user]);

  const { dealingFlights, handleDealingComplete } = useDealingFlights({
    resetKey: tableId,
    selfSeatId,
    snapshot
  });

  useSelfHandComboPruner({
    resetKey: tableId,
    selfSeatId,
    snapshot,
    setSelfHand
  });

  const emitWithAck = useSocketEmitWithAck(socketRef, tableId, setGameError);
  const exitGame = useExitGame({ socketRef, tableId, userId: user?.id, releaseSocket });

  const sendBid = useCallback(
    (bid: number, onComplete?: (result: AckResult) => void) => {
      emitWithAck('game:bid', { tableId, bid }, undefined, onComplete);
    },
    [emitWithAck, tableId]
  );

  const sendDouble = useCallback(
    (double: boolean, onComplete?: (result: AckResult) => void) => {
      emitWithAck('game:double', { tableId, double }, undefined, onComplete);
    },
    [emitWithAck, tableId]
  );

  const sendPlay = useCallback(
    (cardIds: number[], onComplete?: (result: AckResult) => void) => {
      emitWithAck(
        'game:play',
        { tableId, cardIds },
        result => {
          if (!result.ok || cardIds.length === 0) {
            return;
          }
          const played = new Set(cardIds);
          setSelfHand(prev => {
            if (prev.length === 0) return prev;
            const next = prev.filter(card => !played.has(card.id));
            if (next.length !== prev.length) {
              hydrateSharedHand(next);
            }
            return next;
          });
        },
        onComplete
      );
    },
    [emitWithAck, setSelfHand, tableId]
  );

  return {
    apiBaseUrl,
    user,
    authStatus,
    authError,
    gameError,
    snapshot,
    tablePhase,
    tablePhaseStatus,
    selfHand,
    selfSeatId,
    dealingFlights,
    handleDealingComplete,
    exitGame,
    sendBid,
    sendDouble,
    sendPlay,
    setGameError
  };
}

function normalizeAck(response?: AckResult): AckResult {
  if (response && typeof response.ok === 'boolean') {
    return response;
  }
  return { ok: false, message: '未知错误' };
}

function useTablePhaseController(resetKey: string) {
  const [tablePhase, dispatchTablePhase] = useReducer(tablePhaseReducer, initialTablePhase);

  const resetPhase = useCallback(() => dispatchTablePhase({ type: 'reset' }), []);

  useEffect(() => {
    resetPhase();
  }, [resetKey, resetPhase]);

  const syncPhaseFromSnapshot = useCallback(
    (phase: GameSnapshot['phase']) => {
      if (phase === 'idle') {
        dispatchTablePhase({ type: 'reset' });
        return;
      }
      if (phase === 'dealing') {
        dispatchTablePhase({ type: 'start-dealing' });
        return;
      }
      if (phase === 'bidding') {
        dispatchTablePhase({ type: 'start-bidding' });
        return;
      }
      if (phase === 'doubling') {
        dispatchTablePhase({ type: 'start-doubling' });
        return;
      }
      if (phase === 'playing') {
        dispatchTablePhase({ type: 'start-playing' });
        return;
      }
      dispatchTablePhase({ type: 'complete' });
    },
    []
  );

  const tablePhaseStatus = useMemo(() => derivePhaseStatus(tablePhase), [tablePhase]);

  return { tablePhase, tablePhaseStatus, syncPhaseFromSnapshot, resetPhase };
}

function useSelfHandState(resetKey: string) {
  const [selfHand, setSelfHand] = useState<Card[]>([]);

  useEffect(() => subscribeToHandUpdates(cards => setSelfHand(cards)), []);

  useEffect(() => {
    setSelfHand([]);
  }, [resetKey]);

  return { selfHand, setSelfHand };
}

function useSelfHandComboPruner({
  resetKey,
  selfSeatId,
  snapshot,
  setSelfHand
}: {
  resetKey: string;
  selfSeatId: string | null;
  snapshot: GameSnapshot | null;
  setSelfHand: Dispatch<SetStateAction<Card[]>>;
}) {
  const processedSelfCombosRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    processedSelfCombosRef.current = new Set();
  }, [resetKey]);

  useEffect(() => {
    if (!snapshot || !selfSeatId) {
      return;
    }
    const toProcess: Array<{ seatId: string; cardIds: number[] }> = [];

    const maybeQueueCombo = (combo?: { seatId: string; cards: Array<{ id: number }> } | null) => {
      if (!combo || combo.seatId !== selfSeatId) return;
      if (!combo.cards?.length) return;
      const key = `${combo.seatId}-${combo.cards.map(card => card.id).sort((a, b) => a - b).join('-')}`;
      if (processedSelfCombosRef.current.has(key)) return;
      processedSelfCombosRef.current.add(key);
      toProcess.push({ seatId: combo.seatId, cardIds: combo.cards.map(card => card.id) });
    };

    maybeQueueCombo(snapshot.lastCombo);
    if (snapshot.trickCombos && snapshot.trickCombos[selfSeatId]) {
      maybeQueueCombo(snapshot.trickCombos[selfSeatId]);
    }

    if (!toProcess.length) return;

    const idsToRemove = new Set<number>(toProcess.flatMap(entry => entry.cardIds));
    setSelfHand(prev => {
      if (prev.length === 0) return prev;
      const next = prev.filter(card => !idsToRemove.has(card.id));
      if (next.length !== prev.length) {
        hydrateSharedHand(next);
      }
      return next;
    });
  }, [selfSeatId, setSelfHand, snapshot]);
}

function useSocketEmitWithAck(socketRef: MutableRefObject<TableSocket | null>, tableId: string, setGameError: (message: string | null) => void) {
  return useCallback(
    <Payload>(
      event: string,
      payload: Payload,
      onSuccess?: (result: AckResult) => void,
      onComplete?: (result: AckResult) => void
    ) => {
      const socket = socketRef.current;
      if (!socket || !tableId) {
        const fallback = { ok: false, message: '未连接到牌桌' };
        onComplete?.(fallback);
        return;
      }
      socket.emit(event, payload, (response?: AckResult) => {
        const result = normalizeAck(response);
        if (!result.ok && result.message) {
          setGameError(result.message);
        }
        onSuccess?.(result);
        onComplete?.(result);
      });
    },
    [setGameError, socketRef, tableId]
  );
}

function useExitGame({
  socketRef,
  tableId,
  userId,
  releaseSocket
}: {
  socketRef: MutableRefObject<TableSocket | null>;
  tableId: string;
  userId?: number;
  releaseSocket: () => void;
}) {
  return useCallback(
    (onFinished?: () => void) => {
      const socket = socketRef.current;
      const finish = () => {
        releaseSocket();
        onFinished?.();
      };
      if (socket && tableId && userId) {
        let settled = false;
        const timeout = setTimeout(() => {
          if (settled) return;
          settled = true;
          finish();
        }, 600);
        socket.emit('game:leave', { tableId, userId }, () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          finish();
        });
        return;
      }
      finish();
    },
    [releaseSocket, socketRef, tableId, userId]
  );
}
