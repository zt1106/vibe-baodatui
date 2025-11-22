'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { Card } from '@poker/core-cards';
import {
  TablePlayStateResponse as TablePlayStateResponseSchema,
  type GameSnapshot,
  type ServerState
} from '@shared/messages';
import { GameTableStage } from '../../../../components/poker/GameTableStage';
import { type GameTableSeat } from '../../../../components/poker/GameTable';
import { type Socket } from 'socket.io-client';
import {
  acquireTableSocket,
  clearTableSocketJoin,
  isTableSocketJoined,
  markTableSocketJoined,
  releaseTableSocket,
  subscribeToHandUpdates,
  hydrateSharedHand
} from '../../../../lib/tableSocket';
import {
  ensureUser,
  loadStoredUser,
  persistStoredUser,
  type StoredUser
} from '../../../../lib/auth';

type PlayPageProps = {
  params: { tableId: string };
};

type AsyncState = 'idle' | 'loading' | 'ready' | 'error';

const NICKNAME_STORAGE_KEY = 'nickname';

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
  const [user, setUser] = useState<StoredUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AsyncState>('idle');
  const [authError, setAuthError] = useState<string | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [selfHand, setSelfHand] = useState<Card[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const cleanupReleasedRef = useRef(false);

  const apiBaseUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';
    return base.replace(/\/$/, '');
  }, []);

  useEffect(() => {
    if (!tableId) {
      return;
    }
    const bootstrap = async () => {
      setAuthStatus('loading');
      setAuthError(null);
      try {
        const storedUser = loadStoredUser();
        const storedNickname =
          storedUser?.nickname ??
          (typeof window !== 'undefined' ? window.localStorage.getItem(NICKNAME_STORAGE_KEY) : null) ??
          `玩家${Math.floor(Math.random() * 10_000)}`;
        const authenticated = await ensureUser(apiBaseUrl, storedNickname);
        persistStoredUser(authenticated);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(NICKNAME_STORAGE_KEY, authenticated.nickname);
        }
        setUser(authenticated);
        setAuthStatus('ready');
      } catch (error) {
        console.error('[web] failed to ensure user before play page', error);
        setAuthStatus('error');
        setAuthError('无法验证用户，请返回大厅重试。');
      }
    };

    bootstrap();
  }, [apiBaseUrl, tableId]);

  useEffect(() => subscribeToHandUpdates(cards => setSelfHand(cards)), []);

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
      setTimeout(() => {
        router.push(`/game/${encodeURIComponent(tableId)}/prepare`);
      }, 400);
    };

    const handleServerError = (payload: { message?: string }) => {
      if (!active) return;
      setGameError(payload?.message ?? '发生未知错误');
    };

    const handleKicked = (payload: { tableId?: string }) => {
      if (!active || payload?.tableId !== tableId) return;
      setGameError('你已被房主移出房间。');
      setTimeout(() => router.push('/lobby'), 1200);
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
  }, [apiBaseUrl, authStatus, router, tableId, user?.id, user?.nickname]);

  const selfSeatId = useMemo(() => {
    if (!snapshot || !user) return null;
    const seat = snapshot.seats.find(entry => entry.userId === user.id);
    return seat?.seatId ?? null;
  }, [snapshot, user?.id]);

  const tablePlayers = useMemo(() => {
    if (!snapshot) return [];
    return rotateSeats(
      snapshot.seats.map(seat => {
        const status =
          snapshot.lastDealtSeatId === seat.seatId
            ? '发牌中…'
            : seat.handCount > 0
            ? `持有 ${seat.handCount} 张`
            : '等待发牌';
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
  }, [snapshot, selfSeatId]);

  const currentDealingPlayer = useMemo(() => {
    if (!snapshot || !snapshot.lastDealtSeatId) return null;
    return snapshot.seats.find(seat => seat.seatId === snapshot.lastDealtSeatId) ?? null;
  }, [snapshot]);

  const handleExitGame = useCallback(() => {
    const socket = socketRef.current;
    const finish = () => {
      if (socket) {
        releaseTableSocket(socket);
        clearTableSocketJoin(tableId);
        cleanupReleasedRef.current = true;
        socketRef.current = null;
      }
      router.push('/lobby');
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
  }, [router, tableId, user?.id]);

  return (
    <GameTableStage
      players={tablePlayers}
      handCards={selfHand}
      onLeave={handleExitGame}
    />
  );
}
