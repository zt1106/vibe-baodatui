'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { TablePrepareResponse as TablePrepareResponseSchema, type ServerState, type TablePrepareResponse } from '@shared/messages';

import { ensureUser, loadStoredUser, persistStoredUser, NICKNAME_STORAGE_KEY, type StoredUser } from '../lib/auth';
import { fetchJson } from '../lib/api';
import { type AsyncStatus } from '../lib/types';
import { attachTableSocketLifecycle, createTableSocketLease, markTableSocketJoined, type TableSocketLease } from '../lib/tableSocket';
import { generateRandomChineseName } from '../lib/nickname';
import { useApiBaseUrl } from './useApiBaseUrl';
import { useStoredNickname } from './useStoredNickname';

type AsyncState = AsyncStatus;

export function usePrepareRoom(tableId: string) {
  const apiBaseUrl = useApiBaseUrl();
  const { persistNickname } = useStoredNickname();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AsyncState>('idle');
  const [authError, setAuthError] = useState<string | null>(null);
  const [prepareState, setPrepareState] = useState<TablePrepareResponse | null>(null);
  const [prepareStatus, setPrepareStatus] = useState<AsyncState>('idle');
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const socketLeaseRef = useRef<TableSocketLease | null>(null);

  useEffect(() => {
    setPrepareState(null);
    setPrepareStatus('idle');
    setPrepareError(null);
    setReloadToken(0);
  }, [tableId]);

  useEffect(() => {
    if (!tableId) return;
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
        console.error('[web] failed to ensure user before prepare page', error);
        setAuthStatus('error');
        setAuthError('无法验证用户，请返回大厅重试。');
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, persistNickname, tableId]);

  useEffect(() => {
    if (authStatus !== 'ready' || !tableId) return;
    let cancelled = false;
    const controller = new AbortController();

    const loadPrepareState = async () => {
      setPrepareStatus('loading');
      setPrepareError(null);
      try {
        const payload = await fetchJson<unknown>(
          `${apiBaseUrl}/tables/${encodeURIComponent(tableId)}/prepare`,
          {
            method: 'GET',
            credentials: 'include',
            signal: controller.signal
          }
        );
        const parsed = TablePrepareResponseSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error('Invalid table payload');
        }
        if (cancelled) return;
        setPrepareState(prev => {
          if (prev && prev.players.length > 0) {
            const nextPlayers = prev.players;
            return {
              ...parsed.data,
              players: nextPlayers,
              status: prev.status
            };
          }
          return parsed.data;
        });
        setPrepareStatus('ready');
      } catch (error) {
        if (controller.signal.aborted || cancelled) {
          return;
        }
        console.error('[web] failed to load prepare state', error);
        setPrepareError('暂时无法加载房间信息，请稍后重试。');
        setPrepareStatus('error');
      }
    };

    loadPrepareState();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [apiBaseUrl, authStatus, tableId, reloadToken]);

  useEffect(() => {
    if (authStatus !== 'ready' || !user || !tableId) {
      return;
    }
    const lease = createTableSocketLease(apiBaseUrl, tableId);
    socketLeaseRef.current = lease;
    const socket = lease.socket;

    const detachLifecycle = attachTableSocketLifecycle(
      socket,
      tableId,
      { userId: user.id, nickname: user.nickname },
      {
        onConnectError: error => {
          console.error('[web] failed to connect table socket', error);
        },
        onServerError: payload => {
          console.warn('[web] server rejected joinTable request', payload?.message);
          setPrepareError(payload?.message ?? '加入房间失败，请稍后再试。');
        },
        onKicked: payload => {
          if (payload?.tableId !== tableId) return;
          setPrepareError('你已被房主移出房间。');
          setPrepareStatus('error');
        }
      }
    );

    const handleState = (payload: ServerState) => {
      if (payload.tableId !== tableId) {
        return;
      }
      setPrepareState(prevState => ({
        tableId: payload.tableId,
        status: payload.status,
        host: payload.host,
        players: payload.seats.map(player => ({
          userId: player.userId,
          nickname: player.nickname,
          avatar: player.avatar,
          prepared: player.prepared
        })),
        config: payload.config,
        lastResult: payload.lastResult ?? prevState?.lastResult
      }));
      if (payload.seats.some(player => player.userId === user.id)) {
        markTableSocketJoined(tableId);
      }
      setPrepareStatus('ready');
      setPrepareError(null);
    };

    socket.on('state', handleState);

    return () => {
      socket.off('state', handleState);
      detachLifecycle();
      lease.release();
      if (socketLeaseRef.current === lease) {
        socketLeaseRef.current = null;
      }
    };
  }, [apiBaseUrl, authStatus, tableId, user?.id, user?.nickname]);

  const reloadPrepareState = useCallback(() => {
    setReloadToken(token => token + 1);
  }, []);

  const sendTableEvent = useCallback((event: string, ...args: unknown[]) => {
    const socket = socketLeaseRef.current?.socket;
    if (!socket) {
      setPrepareError('连接未建立，稍后再试。');
      return false;
    }
    socket.emit(event, ...(args as []));
    return true;
  }, []);

  const releaseLease = useCallback(() => {
    const lease = socketLeaseRef.current;
    if (lease) {
      lease.release();
      socketLeaseRef.current = null;
    }
  }, []);

  return {
    apiBaseUrl,
    user,
    authStatus,
    authError,
    prepareState,
    prepareStatus,
    prepareError,
    reloadPrepareState,
    sendTableEvent,
    releaseLease,
    setPrepareError
  };
}
