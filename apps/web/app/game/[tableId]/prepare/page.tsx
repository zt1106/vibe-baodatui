'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TablePrepareResponse as TablePrepareResponseSchema } from '@shared/messages';
import type { ServerState, TablePrepareResponse } from '@shared/messages';
import { type Socket } from 'socket.io-client';

import {
  ensureUser,
  loadStoredUser,
  persistStoredUser,
  type StoredUser
} from '../../../../lib/auth';
import {
  acquireTableSocket,
  clearTableSocketJoin,
  isTableSocketJoined,
  markTableSocketJoined,
  releaseTableSocket,
  resetSharedHand
} from '../../../../lib/tableSocket';
import { generateRandomChineseName } from '../../../../lib/nickname';

const NICKNAME_STORAGE_KEY = 'nickname';

type PreparePageProps = {
  params: { tableId: string };
};

type AsyncState = 'idle' | 'loading' | 'ready' | 'error';

const DEFAULT_TABLE_CONFIG = {
  capacity: 8
};

const PREPARE_PAGE_REFRESH_EVENT = 'prepare-page-refresh';

function deriveTableStatus(players: number, capacity: number): TablePrepareResponse['status'] {
  if (players >= capacity) {
    return 'full';
  }
  if (players > 0) {
    return 'in-progress';
  }
  return 'waiting';
}

function seatStatusTone(status: TablePrepareResponse['status']) {
  switch (status) {
    case 'waiting':
      return { label: '等待玩家', background: 'rgba(34, 197, 94, 0.18)', color: '#4ade80' };
    case 'in-progress':
      return { label: '正在准备', background: 'rgba(234, 179, 8, 0.18)', color: '#facc15' };
    case 'full':
      return { label: '房间已满', background: 'rgba(248, 113, 113, 0.18)', color: '#fca5a5' };
    default:
      return { label: '未知状态', background: 'rgba(148, 163, 184, 0.25)', color: '#94a3b8' };
  }
}

export default function PreparePage({ params }: PreparePageProps) {
  const tableId = decodeURIComponent(params.tableId ?? '');
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AsyncState>('idle');
  const [authError, setAuthError] = useState<string | null>(null);
  const [prepareState, setPrepareState] = useState<TablePrepareResponse | null>(null);
  const [prepareStatus, setPrepareStatus] = useState<AsyncState>('idle');
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [configDraft, setConfigDraft] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const preserveSocketForPlayRef = useRef(false);
  const manualReleaseRef = useRef(false);
  const cleanupReleasedRef = useRef(false);
  const navigatedToPlayRef = useRef(false);

  const apiBaseUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';
    return base.replace(/\/$/, '');
  }, []);

  useEffect(() => {
    preserveSocketForPlayRef.current = false;
    manualReleaseRef.current = false;
    cleanupReleasedRef.current = false;
    navigatedToPlayRef.current = false;
  }, [tableId]);

  useEffect(() => {
    if (!tableId) return;
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
        persistStoredUser(authenticated);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(NICKNAME_STORAGE_KEY, authenticated.nickname);
        }
        setUser(authenticated);
        setAuthStatus('ready');
      } catch (error) {
        console.error('[web] failed to ensure user before prepare page', error);
        setAuthStatus('error');
        setAuthError('无法验证用户，请返回大厅重试。');
      }
    };

    bootstrap();
  }, [apiBaseUrl, tableId]);

  useEffect(() => {
    if (!prepareState) {
      setConfigDraft(null);
      return;
    }
    setConfigDraft(prepareState.config.capacity);
  }, [prepareState]);

  useEffect(() => {
    if (authStatus !== 'ready' || !tableId) return;
    let cancelled = false;
    const controller = new AbortController();

    const loadPrepareState = async () => {
      setPrepareStatus('loading');
      setPrepareError(null);
      try {
        const response = await fetch(`${apiBaseUrl}/tables/${encodeURIComponent(tableId)}/prepare`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const payload = await response.json();
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
    let active = true;
    manualReleaseRef.current = false;
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
      setPrepareState({
        tableId: payload.tableId,
        status: payload.status,
        host: payload.host,
        players: payload.seats.map(player => ({
          userId: player.userId,
          nickname: player.nickname,
          avatar: player.avatar,
          prepared: player.prepared
        })),
        config: payload.config
      });
      if (payload.seats.some(player => player.userId === user.id)) {
        markTableSocketJoined(tableId);
      }
      setPrepareStatus('ready');
      setPrepareError(null);
    };

    const handleConnectError = (error: Error) => {
      if (!active) return;
      console.error('[web] failed to connect table socket', error);
    };

    const handleServerError = (payload: { message?: string }) => {
      if (!active) return;
      console.warn('[web] server rejected joinTable request', payload?.message);
      setPrepareError(payload?.message ?? '加入房间失败，请稍后再试。');
    };

    const handleKicked = (payload: { tableId?: string }) => {
      if (!active) return;
      if (payload?.tableId !== tableId) return;
      setPrepareError('你已被房主移出房间。');
      setPrepareStatus('error');
      setTimeout(() => router.push('/lobby'), 1200);
    };

    socket.on('connect', handleConnect);
    socket.on('reconnect', handleReconnect);
    socket.on('state', handleState);
    socket.on('connect_error', handleConnectError);
    socket.on('errorMessage', handleServerError);
    socket.on('kicked', handleKicked);
    requestJoin();

    return () => {
      active = false;
      socket.off('connect', handleConnect);
      socket.off('reconnect', handleReconnect);
      socket.off('state', handleState);
      socket.off('connect_error', handleConnectError);
      socket.off('errorMessage', handleServerError);
      socket.off('kicked', handleKicked);
      if (!preserveSocketForPlayRef.current && !manualReleaseRef.current && !cleanupReleasedRef.current) {
        releaseTableSocket(socket);
        clearTableSocketJoin(tableId);
        cleanupReleasedRef.current = true;
        socketRef.current = null;
      }
    };
  }, [apiBaseUrl, authStatus, tableId, router, user?.id, user?.nickname]);

  const handleLeaveRoom = useCallback(() => {
    manualReleaseRef.current = true;
    const socket = socketRef.current;
    if (socket) {
      releaseTableSocket(socket);
      clearTableSocketJoin(tableId);
      socketRef.current = null;
    }
    router.push('/lobby');
  }, [router, tableId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleExternalRefresh = () => {
      setReloadToken(token => token + 1);
    };
    window.addEventListener(PREPARE_PAGE_REFRESH_EVENT, handleExternalRefresh);
    return () => {
      window.removeEventListener(PREPARE_PAGE_REFRESH_EVENT, handleExternalRefresh);
    };
  }, []);

  useEffect(() => {
    if (!tableId || !prepareState || !user) return;
    if (prepareState.status !== 'in-progress') return;
    const isSeated = prepareState.players.some(player => player.userId === user.id);
    if (!isSeated || navigatedToPlayRef.current) return;
    navigatedToPlayRef.current = true;
    preserveSocketForPlayRef.current = true;
    resetSharedHand();
    router.push(`/game/${encodeURIComponent(tableId)}/play`);
  }, [prepareState, router, tableId, user?.id]);

  const sendTableEvent = useCallback((event: string, payload: Record<string, unknown>) => {
    const socket = socketRef.current;
    if (!socket) {
      setPrepareError('连接未建立，稍后再试。');
      return false;
    }
    socket.emit(event, payload);
    return true;
  }, []);

  const handleStartGame = useCallback(() => {
    sendTableEvent('table:start', { tableId });
  }, [sendTableEvent, tableId]);

  const handleKickPlayer = useCallback(
    (targetUserId: number) => {
      sendTableEvent('table:kick', { tableId, userId: targetUserId });
    },
    [sendTableEvent, tableId]
  );

  const handleAdjustCapacity = useCallback(
    (delta: number, min = 2, max = DEFAULT_TABLE_CONFIG.capacity) => {
      setConfigDraft(current => {
        const baseline = current ?? prepareState?.config.capacity ?? DEFAULT_TABLE_CONFIG.capacity;
        const next = Math.min(Math.max(baseline + delta, min), max);
        return next;
      });
    },
    [prepareState?.config.capacity]
  );

  const handleSaveConfig = useCallback(() => {
    if (configDraft === null) return;
    sendTableEvent('table:updateConfig', { tableId, capacity: configDraft });
  }, [configDraft, sendTableEvent, tableId]);

  const playerCount = prepareState?.players.length ?? 0;
  const capacity = prepareState?.config.capacity ?? 0;
  const resolvedCapacity = capacity || DEFAULT_TABLE_CONFIG.capacity;
  const isHost = Boolean(user && prepareState && prepareState.host.userId === user.id);
  const selfPlayer = useMemo(() => {
    if (!prepareState || !user) return null;
    return prepareState.players.find(player => player.userId === user.id) ?? null;
  }, [prepareState, user?.id]);
  const isSelfSeated = Boolean(selfPlayer);
  const selfPrepared = Boolean(selfPlayer?.prepared);
  const everyonePrepared = prepareState?.players.every(player => player.prepared) ?? false;
  const canHostStart = isHost && playerCount === resolvedCapacity && everyonePrepared;
  const configIsDirty = Boolean(
    isHost && prepareState && configDraft !== null && configDraft !== prepareState.config.capacity
  );
  const canTogglePrepared = prepareStatus === 'ready' && isSelfSeated;
  const preparedButtonLabel = !isSelfSeated ? '等待入座' : selfPrepared ? '已准备' : '准备';
  const handleTogglePrepared = useCallback(() => {
    if (!isSelfSeated) {
      setPrepareError('请先加入座位。');
      return;
    }
    sendTableEvent('table:setPrepared', { tableId, prepared: !selfPrepared });
  }, [isSelfSeated, selfPrepared, sendTableEvent, tableId]);
  const seats = useMemo(() => {
    if (!prepareState) return [];
    const total = prepareState.config.capacity;
    return Array.from({ length: total }, (_, index) => ({
      seatNumber: index + 1,
      player: prepareState.players[index] ?? null
    }));
  }, [prepareState]);

  const statusTone = prepareState ? seatStatusTone(prepareState.status) : null;

  return (
    <main
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem',
        gap: '1.5rem',
        background:
          'radial-gradient(circle at 15% 20%, rgba(56, 189, 248, 0.08), transparent 50%), #020617',
        color: '#e2e8f0',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          background: 'rgba(15, 23, 42, 0.85)',
          borderRadius: 24,
          border: '1px solid rgba(148, 163, 184, 0.28)',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.4)'
        }}
      >
        <div style={{ display: 'grid', gap: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>牌局准备</h1>
            {statusTone && (
              <span
                style={{
                  padding: '0.3rem 0.9rem',
                  borderRadius: 999,
                  background: statusTone.background,
                  color: statusTone.color,
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                {statusTone.label}
              </span>
            )}
          </div>
          <span data-testid="room-code" style={{ opacity: 0.75 }}>
            房间编号：{tableId || '未知'}
          </span>
          {user && (
            <span style={{ fontSize: '0.95rem', opacity: 0.7 }}>
              当前用户：{user.nickname}（ID {user.id}）
            </span>
          )}
          {prepareState?.host && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid rgba(148, 163, 184, 0.45)'
                }}
              >
                <img
                  src={`/avatars/${prepareState.host.avatar}`}
                  alt={`${prepareState.host.nickname} 头像`}
                  width={32}
                  height={32}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <span style={{ fontSize: '0.95rem', opacity: 0.7 }}>
                房主：{prepareState.host.nickname}（ID {prepareState.host.userId}）
              </span>
            </div>
          )}
          {authStatus === 'loading' && <span style={{ opacity: 0.7 }}>正在验证用户身份…</span>}
          {authStatus === 'error' && authError && (
            <span style={{ color: '#fca5a5' }}>{authError}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleLeaveRoom}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: 999,
              border: '1px solid rgba(248, 113, 113, 0.5)',
              background: 'rgba(248, 113, 113, 0.12)',
              color: '#fecaca',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            离开房间
          </button>
        </div>
      </header>

      {!tableId && (
        <section
          style={{
            background: 'rgba(15, 23, 42, 0.78)',
            border: '1px solid rgba(248, 113, 113, 0.35)',
            borderRadius: 18,
            padding: '1.5rem',
            color: '#fecaca'
          }}
        >
          无效的房间地址，请返回大厅重新选择。
        </section>
      )}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
          gap: '1.5rem',
          flex: 1,
          minHeight: 0
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            borderRadius: 24,
            border: '1px solid rgba(148, 163, 184, 0.28)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.4)',
            minHeight: 0
          }}
        >
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>玩家列表</h2>
              <p style={{ margin: '0.25rem 0 0', opacity: 0.75 }}>
                当前 {playerCount} / {capacity || '—'} 名玩家
              </p>
            </div>
          </header>

          {prepareStatus === 'loading' && (
            <div style={{ opacity: 0.7 }}>正在同步座位信息…</div>
          )}

          {prepareStatus === 'error' && prepareError && (
            <div style={{ color: '#fca5a5' }}>{prepareError}</div>
          )}

          {prepareStatus === 'ready' && seats.length === 0 && (
            <div style={{ opacity: 0.7 }}>暂未有人加入，快邀请朋友一起准备吧！</div>
          )}

          {seats.length > 0 && (
            <div
              data-testid="prepare-player-list"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '1rem',
                overflowY: 'auto',
                paddingRight: '0.25rem'
              }}
            >
              {seats.map(({ seatNumber, player }) => (
                <article
                  key={seatNumber}
                  style={{
                    borderRadius: 18,
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    padding: '1rem',
                    background: player ? 'rgba(34, 197, 94, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                    display: 'grid',
                    gap: '0.35rem',
                    boxShadow: '0 16px 36px rgba(15, 23, 42, 0.35)'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>座位 {seatNumber}</span>
                  {player ? (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 12,
                              overflow: 'hidden',
                              border: '1px solid rgba(148, 163, 184, 0.45)'
                            }}
                          >
                            <img
                              src={`/avatars/${player.avatar}`}
                              alt={`${player.nickname} 头像`}
                              width={34}
                              height={34}
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <strong style={{ fontSize: '1.05rem' }}>{player.nickname}</strong>
                        </div>
                        {prepareState?.host.userId === player.userId && (
                          <span
                            style={{
                              padding: '0.1rem 0.5rem',
                              borderRadius: 999,
                              fontSize: '0.75rem',
                              background: 'rgba(234, 179, 8, 0.2)',
                              color: '#facc15'
                            }}
                          >
                            房主
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.9rem', opacity: 0.75 }}>ID：{player.userId}</span>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          color: player.prepared ? '#4ade80' : '#f87171',
                          fontWeight: 600
                        }}
                      >
                        {player.prepared ? '已准备' : '未准备'}
                      </span>
                      {isHost && user && player.userId !== user.id && prepareState?.host.userId !== player.userId && (
                        <button
                          type="button"
                          onClick={() => handleKickPlayer(player.userId)}
                          style={{
                            marginTop: '0.35rem',
                            padding: '0.45rem 0.9rem',
                            borderRadius: 10,
                            border: '1px solid rgba(248, 113, 113, 0.5)',
                            background: 'rgba(248, 113, 113, 0.12)',
                            color: '#fecaca',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          移出房间
                        </button>
                      )}
                    </>
                  ) : (
                    <span style={{ opacity: 0.5 }}>空位，等待玩家加入…</span>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {isHost && (
            <section
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                borderRadius: 24,
                border: '1px solid rgba(34, 197, 94, 0.25)',
                padding: '1.5rem',
                boxShadow: '0 24px 60px rgba(15, 23, 42, 0.4)',
                display: 'grid',
                gap: '1rem'
              }}
            >
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>房主控制台</h2>
                <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  当前人数：{playerCount} / {capacity || '—'}
                </span>
              </header>
              <button
                data-testid="start-game-button"
                type="button"
                onClick={handleStartGame}
                disabled={!canHostStart}
                style={{
                  padding: '0.9rem 1.25rem',
                  borderRadius: 18,
                  border: 'none',
                  background: canHostStart
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : 'rgba(148, 163, 184, 0.25)',
                  color: canHostStart ? '#022c22' : '#94a3b8',
                  fontWeight: 700,
                  cursor: canHostStart ? 'pointer' : 'not-allowed',
                  boxShadow: canHostStart ? '0 20px 40px rgba(34, 197, 94, 0.25)' : 'none'
                }}
              >
                开始对局
              </button>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>最多玩家数</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    data-testid="capacity-decrement"
                    type="button"
                    onClick={() => handleAdjustCapacity(-1, 2, DEFAULT_TABLE_CONFIG.capacity)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      border: '1px solid rgba(148, 163, 184, 0.4)',
                      background: 'rgba(15, 23, 42, 0.6)',
                      color: '#e2e8f0',
                      fontSize: '1.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    −
                  </button>
                  <strong
                    data-testid="capacity-value"
                    style={{ fontSize: '1.4rem', minWidth: 40, textAlign: 'center' }}
                  >
                    {configDraft ?? resolvedCapacity}
                  </strong>
                  <button
                    data-testid="capacity-increment"
                    type="button"
                    onClick={() => handleAdjustCapacity(1, 2, DEFAULT_TABLE_CONFIG.capacity)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      border: '1px solid rgba(148, 163, 184, 0.4)',
                      background: 'rgba(15, 23, 42, 0.6)',
                      color: '#e2e8f0',
                      fontSize: '1.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    ＋
                  </button>
                  <button
                    data-testid="capacity-save-button"
                    type="button"
                    onClick={handleSaveConfig}
                    disabled={!configIsDirty}
                    style={{
                      padding: '0.65rem 1.1rem',
                      borderRadius: 12,
                      border: 'none',
                      background: configIsDirty
                        ? 'linear-gradient(135deg, #38bdf8, #6366f1)'
                        : 'rgba(148, 163, 184, 0.25)',
                      color: configIsDirty ? '#0f172a' : '#94a3b8',
                      fontWeight: 600,
                      cursor: configIsDirty ? 'pointer' : 'not-allowed'
                    }}
                  >
                    保存配置
                  </button>
                </div>
              </div>
            </section>
          )}

          <section
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 24,
              border: '1px solid rgba(148, 163, 184, 0.28)',
              padding: '1.5rem',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.4)',
              display: 'grid',
              gap: '1rem'
            }}
          >
            <header>
              <h2 style={{ margin: 0 }}>牌桌配置</h2>
              <p style={{ margin: '0.35rem 0 0', opacity: 0.75 }}>更多选项即将上线</p>
            </header>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: '0.5rem' }}>
              <li>最多玩家：{capacity || '—'} 名</li>
              <li>当前人数：{playerCount} 名</li>
            </ul>
            <button
              data-testid="ready-button"
              type="button"
              onClick={handleTogglePrepared}
              disabled={!canTogglePrepared}
              style={{
                padding: '0.9rem 1.25rem',
                borderRadius: 18,
                border: 'none',
                background: selfPrepared
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                  : 'linear-gradient(135deg, #38bdf8, #6366f1)',
                color: selfPrepared ? '#022c22' : '#0f172a',
                fontWeight: 700,
                cursor: canTogglePrepared ? 'pointer' : 'not-allowed',
                opacity: canTogglePrepared ? 1 : 0.6,
                boxShadow: selfPrepared ? '0 20px 40px rgba(34, 197, 94, 0.25)' : '0 20px 40px rgba(56, 189, 248, 0.25)'
              }}
            >
              {preparedButtonLabel}
            </button>
            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
              {isSelfSeated
                ? selfPrepared
                  ? '已准备，等待房主开始对局。'
                  : '点击准备后，等待房主操作。'
                : '加入座位后即可准备。'}
            </span>
          </section>

          <section
            style={{
              background: 'rgba(15, 23, 42, 0.78)',
              borderRadius: 24,
              border: '1px dashed rgba(148, 163, 184, 0.35)',
              padding: '1.25rem',
              minHeight: 140
            }}
          >
            <h3 style={{ margin: 0 }}>上一局战报</h3>
            <p style={{ margin: '0.5rem 0 0', opacity: 0.65 }}>战报整理中，敬请期待。</p>
          </section>

          <section
            style={{
              background: 'rgba(15, 23, 42, 0.78)',
              borderRadius: 24,
              border: '1px dashed rgba(148, 163, 184, 0.35)',
              padding: '1.25rem',
              minHeight: 180
            }}
          >
            <h3 style={{ margin: 0 }}>聊天室</h3>
            <p style={{ margin: '0.5rem 0 0', opacity: 0.65 }}>聊天面板开发中，稍后开放。</p>
          </section>
        </div>
      </section>
    </main>
  );
}
