'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import type { Card } from '@poker/core-cards';
import { createCardId } from '@poker/core-cards';
import { TablePlayStateResponse as TablePlayStateResponseSchema, type GameSnapshot, type ServerState } from '@shared/messages';
import { derivePhaseStatus, initialTablePhase, tablePhaseReducer } from '@shared/tablePhases';

import { ensureUser, loadStoredUser, persistStoredUser, NICKNAME_STORAGE_KEY, type StoredUser } from '../lib/auth';
import {
  acquireTableSocket,
  clearTableSocketJoin,
  hydrateSharedHand,
  isTableSocketJoined,
  markTableSocketJoined,
  releaseTableSocket,
  subscribeToHandUpdates
} from '../lib/tableSocket';
import type { DealingCardFlight } from '../components/poker/GameTable';
import { generateRandomChineseName } from '../lib/nickname';
import { useApiBaseUrl } from './useApiBaseUrl';
import { useStoredNickname } from './useStoredNickname';

type AsyncState = 'idle' | 'loading' | 'ready' | 'error';
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

  const { socketRef, releaseSocket } = useTableSocketLifecycle({
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
  }, [snapshot, user?.id]);

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

function usePlaySessionAuth({
  apiBaseUrl,
  persistNickname,
  tableId
}: {
  apiBaseUrl: string;
  persistNickname: (nickname: string) => void;
  tableId: string;
}) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AsyncState>('idle');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setUser(null);
    setAuthStatus('idle');
    setAuthError(null);
  }, [tableId]);

  useEffect(() => {
    if (!tableId) {
      return;
    }
    let cancelled = false;
    const bootstrap = async () => {
      setAuthStatus('loading');
      setAuthError(null);
      try {
        const storedUser = loadStoredUser();
        const storedNickname =
          storedUser?.nickname ??
          (typeof window !== 'undefined' ? window.localStorage.getItem(NICKNAME_STORAGE_KEY) : null) ??
          generateRandomChineseName();
        const authenticated = await ensureUser(apiBaseUrl, storedNickname);
        if (cancelled) return;
        persistStoredUser(authenticated);
        persistNickname(authenticated.nickname);
        setUser(authenticated);
        setAuthStatus('ready');
      } catch (error) {
        if (cancelled) return;
        console.error('[web] failed to ensure user before play page', error);
        setAuthStatus('error');
        setAuthError('无法验证用户，请返回大厅重试。');
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, persistNickname, tableId]);

  return { user, authStatus, authError };
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

function useDealingFlights({
  resetKey,
  selfSeatId,
  snapshot
}: {
  resetKey: string;
  selfSeatId: string | null;
  snapshot: GameSnapshot | null;
}) {
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

function useTableSocketLifecycle({
  apiBaseUrl,
  tableId,
  user,
  authStatus,
  syncPhaseFromSnapshot,
  setSnapshot,
  setSelfHand,
  setGameError,
  onGameEnded,
  onKicked,
  resetPhase
}: {
  apiBaseUrl: string;
  tableId: string;
  user: StoredUser | null;
  authStatus: AsyncState;
  syncPhaseFromSnapshot: (phase: GameSnapshot['phase']) => void;
  setSnapshot: (snapshot: GameSnapshot) => void;
  setSelfHand: (hand: Card[]) => void;
  setGameError: (message: string | null) => void;
  onGameEnded?: (tableId: string) => void;
  onKicked?: (tableId: string) => void;
  resetPhase: () => void;
}) {
  const socketRef = useRef<ReturnType<typeof acquireTableSocket> | null>(null);
  const cleanupReleasedRef = useRef(false);

  const releaseSocket = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || cleanupReleasedRef.current) {
      return;
    }
    releaseTableSocket(socket);
    clearTableSocketJoin(tableId);
    cleanupReleasedRef.current = true;
    socketRef.current = null;
  }, [tableId]);

  useEffect(() => {
    if (authStatus !== 'ready' || !user || !tableId) {
      return;
    }
    let active = true;
    cleanupReleasedRef.current = false;
    const socket = acquireTableSocket(apiBaseUrl, tableId);
    socketRef.current = socket;

    const joinPayload = { tableId, nickname: user.nickname, userId: user.id };

    const requestJoin = () => {
      if (!isTableSocketJoined(tableId)) {
        socket.emit('joinTable', joinPayload);
      }
    };

    const handleConnect = () => {
      if (!active) return;
      requestJoin();
    };

    const handleReconnect = () => {
      if (!active) return;
      clearTableSocketJoin(tableId);
      requestJoin();
    };

    const handleState = (payload: ServerState) => {
      if (!active || payload.tableId !== tableId) {
        return;
      }
      if (payload.seats.some(seat => seat.userId === user.id)) {
        markTableSocketJoined(tableId);
      }
    };

    const handleSnapshot = (payload: GameSnapshot) => {
      if (!active || payload.tableId !== tableId) return;
      setSnapshot(payload);
      syncPhaseFromSnapshot(payload.phase);
      setGameError(null);
    };

    const handleHydrate = (payload: unknown) => {
      if (!active) return;
      const parsed = TablePlayStateResponseSchema.safeParse(payload);
      if (!parsed.success || parsed.data.snapshot.tableId !== tableId) {
        return;
      }
      setSnapshot(parsed.data.snapshot);
      setSelfHand(parsed.data.hand);
      hydrateSharedHand(parsed.data.hand);
      syncPhaseFromSnapshot(parsed.data.snapshot.phase);
      setGameError(null);
    };

    const handleConnectError = (error: Error) => {
      if (!active) return;
      setGameError('无法连接到牌桌，请稍后重试。');
      console.error('[web] play socket connect error', error);
    };

    const handleGameEnded = (payload: { tableId?: string; reason?: string }) => {
      if (!active) return;
      if (payload?.tableId && payload.tableId !== tableId) return;
      if (payload.reason === 'completed') {
        setGameError(null);
      } else if (payload.reason === 'manual-reset') {
        setGameError('房主已重置牌局，返回准备房间。');
      } else {
        setGameError('有玩家离开，牌局已结束，返回准备房间。');
      }
      resetPhase();
      onGameEnded?.(tableId);
    };

    const handleServerError = (payload: { message?: string }) => {
      if (!active) return;
      setGameError(payload?.message ?? '发生未知错误');
    };

    const handleKicked = (payload: { tableId?: string }) => {
      if (!active || payload?.tableId !== tableId) return;
      setGameError('你已被房主移出房间。');
      onKicked?.(tableId);
    };

    socket.on('connect', handleConnect);
    socket.on('reconnect', handleReconnect);
    socket.on('state', handleState);
    socket.on('game:snapshot', handleSnapshot);
    socket.on('game:hydrate', handleHydrate);
    socket.on('connect_error', handleConnectError);
    socket.on('game:ended', handleGameEnded);
    socket.on('errorMessage', handleServerError);
    socket.on('kicked', handleKicked);
    requestJoin();

    return () => {
      active = false;
      socket.off('connect', handleConnect);
      socket.off('reconnect', handleReconnect);
      socket.off('state', handleState);
      socket.off('game:snapshot', handleSnapshot);
      socket.off('game:hydrate', handleHydrate);
      socket.off('connect_error', handleConnectError);
      socket.off('game:ended', handleGameEnded);
      socket.off('errorMessage', handleServerError);
      socket.off('kicked', handleKicked);
      releaseSocket();
    };
  }, [
    apiBaseUrl,
    authStatus,
    onGameEnded,
    onKicked,
    releaseSocket,
    setGameError,
    setSelfHand,
    setSnapshot,
    syncPhaseFromSnapshot,
    tableId,
    resetPhase,
    user?.id,
    user?.nickname
  ]);

  return { socketRef, releaseSocket };
}

function useSocketEmitWithAck(
  socketRef: MutableRefObject<ReturnType<typeof acquireTableSocket> | null>,
  tableId: string,
  setGameError: (message: string | null) => void
) {
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
  socketRef: MutableRefObject<ReturnType<typeof acquireTableSocket> | null>;
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
