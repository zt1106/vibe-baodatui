'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

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

type UsePlaySessionOptions = {
  onGameEnded?: (tableId: string) => void;
  onKicked?: (tableId: string) => void;
};

export function usePlaySession(tableId: string, options: UsePlaySessionOptions = {}) {
  const apiBaseUrl = useApiBaseUrl();
  const { persistNickname } = useStoredNickname();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AsyncState>('idle');
  const [authError, setAuthError] = useState<string | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [selfHand, setSelfHand] = useState<Card[]>([]);
  const [dealingFlights, setDealingFlights] = useState<DealingCardFlight[]>([]);
  const [tablePhase, dispatchTablePhase] = useReducer(tablePhaseReducer, initialTablePhase);
  const socketRef = useRef<ReturnType<typeof acquireTableSocket> | null>(null);
  const cleanupReleasedRef = useRef(false);
  const lastSnapshotRef = useRef<GameSnapshot | null>(null);
  const dealSeqRef = useRef(0);

  useEffect(() => {
    setSnapshot(null);
    setSelfHand([]);
    setGameError(null);
    setDealingFlights([]);
    dispatchTablePhase({ type: 'reset' });
    lastSnapshotRef.current = null;
    dealSeqRef.current = 0;
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

  useEffect(() => subscribeToHandUpdates(cards => setSelfHand(cards)), []);

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

    const handleGameEnded = (payload: { tableId?: string }) => {
      if (!active) return;
      if (payload?.tableId && payload.tableId !== tableId) return;
      setGameError('有玩家离开，牌局已结束，返回准备房间。');
      dispatchTablePhase({ type: 'reset' });
      options.onGameEnded?.(tableId);
    };

    const handleServerError = (payload: { message?: string }) => {
      if (!active) return;
      setGameError(payload?.message ?? '发生未知错误');
    };

    const handleKicked = (payload: { tableId?: string }) => {
      if (!active || payload?.tableId !== tableId) return;
      setGameError('你已被房主移出房间。');
      options.onKicked?.(tableId);
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
      if (!cleanupReleasedRef.current) {
        releaseTableSocket(socket);
        clearTableSocketJoin(tableId);
        cleanupReleasedRef.current = true;
        socketRef.current = null;
      }
    };
  }, [
    apiBaseUrl,
    authStatus,
    options.onGameEnded,
    options.onKicked,
    syncPhaseFromSnapshot,
    tableId,
    user?.id,
    user?.nickname
  ]);

  const tablePhaseStatus = useMemo(() => derivePhaseStatus(tablePhase), [tablePhase]);

  const selfSeatId = useMemo(() => {
    if (!snapshot || !user) return null;
    const seat = snapshot.seats.find(entry => entry.userId === user.id);
    return seat?.seatId ?? null;
  }, [snapshot, user?.id]);

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

  const exitGame = useCallback(
    (onFinished?: () => void) => {
      const socket = socketRef.current;
      const finish = () => {
        if (socket) {
          releaseTableSocket(socket);
          clearTableSocketJoin(tableId);
          cleanupReleasedRef.current = true;
          socketRef.current = null;
        }
        onFinished?.();
      };
      if (socket && tableId && user?.id) {
        let settled = false;
        const timeout = setTimeout(() => {
          if (settled) return;
          settled = true;
          finish();
        }, 600);
        socket.emit('game:leave', { tableId, userId: user.id }, () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          finish();
        });
        return;
      }
      finish();
    },
    [tableId, user?.id]
  );

  const sendBid = useCallback(
    (bid: number, onComplete?: (result: { ok: boolean; message?: string }) => void) => {
      const socket = socketRef.current;
      if (!socket || !tableId) {
        onComplete?.({ ok: false, message: '未连接到牌桌' });
        return;
      }
      socket.emit('game:bid', { tableId, bid }, (response?: { ok: boolean; message?: string }) => {
        if (!response?.ok && response?.message) {
          setGameError(response.message);
        }
        onComplete?.(response ?? { ok: false, message: '未知错误' });
      });
    },
    [tableId]
  );

  const sendDouble = useCallback(
    (double: boolean, onComplete?: (result: { ok: boolean; message?: string }) => void) => {
      const socket = socketRef.current;
      if (!socket || !tableId) {
        onComplete?.({ ok: false, message: '未连接到牌桌' });
        return;
      }
      socket.emit('game:double', { tableId, double }, (response?: { ok: boolean; message?: string }) => {
        if (!response?.ok && response?.message) {
          setGameError(response.message);
        }
        onComplete?.(response ?? { ok: false, message: '未知错误' });
      });
    },
    [tableId]
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
    setGameError
  };
}
