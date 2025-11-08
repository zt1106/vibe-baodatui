'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TablePrepareResponse as TablePrepareResponseSchema } from '@shared/messages';
import type { ServerState, TablePrepareResponse } from '@shared/messages';
import { io, Socket } from 'socket.io-client';

import {
  ensureUser,
  loadStoredUser,
  persistStoredUser,
  type StoredUser
} from '../../../../lib/auth';
import { generateRandomChineseName } from '../../../../lib/nickname';

const NICKNAME_STORAGE_KEY = 'nickname';

type PreparePageProps = {
  params: { tableId: string };
};

type AsyncState = 'idle' | 'loading' | 'ready' | 'error';

const DEFAULT_TABLE_CONFIG = {
  capacity: 6,
  minimumPlayers: 2
};

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
  const [isPrepared, setIsPrepared] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const apiBaseUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';
    return base.replace(/\/$/, '');
  }, []);

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
              status: deriveTableStatus(nextPlayers.length, parsed.data.config.capacity)
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
    const socket = io(apiBaseUrl, {
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelayMax: 2_000
    });
    socketRef.current = socket;

    const joinPayload = { tableId, nickname: user.nickname, userId: user.id };

    const requestJoin = () => {
      socket.emit('joinTable', joinPayload);
    };

    const handleState = (payload: ServerState) => {
      if (!active || payload.tableId !== tableId) {
        return;
      }
      setPrepareState(prev => {
        const config = prev?.config ?? DEFAULT_TABLE_CONFIG;
        return {
          tableId: payload.tableId,
          status: deriveTableStatus(payload.seats.length, config.capacity),
          players: payload.seats.map(player => ({
            userId: player.userId,
            nickname: player.nickname
          })),
          config
        };
      });
      setPrepareStatus('ready');
      setPrepareError(null);
    };

    socket.on('connect', requestJoin);
    socket.on('reconnect', requestJoin);
    socket.on('state', handleState);
    socket.on('connect_error', error => {
      if (!active) return;
      console.error('[web] failed to connect table socket', error);
    });
    socket.on('errorMessage', (payload: { message?: string }) => {
      if (!active) return;
      console.warn('[web] server rejected joinTable request', payload?.message);
      setPrepareError(payload?.message ?? '加入房间失败，请稍后再试。');
    });

    return () => {
      active = false;
      socket.off('connect', requestJoin);
      socket.off('reconnect', requestJoin);
      socket.off('state', handleState);
      socket.off('errorMessage');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [apiBaseUrl, authStatus, tableId, user?.id, user?.nickname]);

  const handleManualRefresh = useCallback(() => {
    setReloadToken(token => token + 1);
  }, []);

  const handleLeaveRoom = useCallback(() => {
    router.push('/lobby');
  }, [router]);

  const handleTogglePrepared = useCallback(() => {
    setIsPrepared(prev => !prev);
  }, []);

  const playerCount = prepareState?.players.length ?? 0;
  const capacity = prepareState?.config.capacity ?? 0;
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
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem',
        gap: '1.5rem',
        background:
          'radial-gradient(circle at 15% 20%, rgba(56, 189, 248, 0.08), transparent 50%), #020617',
        color: '#e2e8f0',
        boxSizing: 'border-box'
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
          <span style={{ opacity: 0.75 }}>房间编号：{tableId || '未知'}</span>
          {user && (
            <span style={{ fontSize: '0.95rem', opacity: 0.7 }}>
              当前用户：{user.nickname}（ID {user.id}）
            </span>
          )}
          {authStatus === 'loading' && <span style={{ opacity: 0.7 }}>正在验证用户身份…</span>}
          {authStatus === 'error' && authError && (
            <span style={{ color: '#fca5a5' }}>{authError}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={prepareStatus === 'loading'}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: 999,
              border: '1px solid rgba(96, 165, 250, 0.5)',
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#bfdbfe',
              fontWeight: 600,
              cursor: prepareStatus === 'loading' ? 'wait' : 'pointer'
            }}
          >
            刷新
          </button>
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
                      <strong style={{ fontSize: '1.05rem' }}>{player.nickname}</strong>
                      <span style={{ fontSize: '0.9rem', opacity: 0.75 }}>ID：{player.userId}</span>
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
              <li>最少开局人数：{prepareState?.config.minimumPlayers ?? '—'} 名</li>
              <li>当前人数：{playerCount} 名</li>
            </ul>
            <button
              type="button"
              onClick={handleTogglePrepared}
              disabled={prepareStatus !== 'ready'}
              style={{
                padding: '0.9rem 1.25rem',
                borderRadius: 18,
                border: 'none',
                background: isPrepared
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                  : 'linear-gradient(135deg, #38bdf8, #6366f1)',
                color: '#0f172a',
                fontWeight: 700,
                cursor: prepareStatus !== 'ready' ? 'not-allowed' : 'pointer',
                opacity: prepareStatus !== 'ready' ? 0.6 : 1,
                boxShadow: '0 20px 40px rgba(56, 189, 248, 0.25)'
              }}
            >
              {isPrepared ? '已准备' : '准备'}
            </button>
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
