import { useCallback, useEffect, useRef } from 'react';

import type { Card } from '@poker/core-cards';
import { TablePlayStateResponse as TablePlayStateResponseSchema, type GameSnapshot, type ServerState } from '@shared/messages';

import {
  acquireTableSocket,
  clearTableSocketJoin,
  hydrateSharedHand,
  isTableSocketJoined,
  markTableSocketJoined,
  releaseTableSocket
} from '../lib/tableSocket';
import type { StoredUser } from '../lib/auth';
import type { AsyncState } from './usePlaySessionAuth';

type UseTableSocketOptions = {
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
};

export function useTableSocket({
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
}: UseTableSocketOptions) {
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
    user
  ]);

  return { socketRef, releaseSocket };
}
