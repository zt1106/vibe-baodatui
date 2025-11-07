'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { LobbyRoomsResponse } from '@shared/messages';
import type { LobbyNotification, LobbyRoom } from '@shared/messages';

import { useHeartbeat } from '../../lib/heartbeat';
import { ensureUser, loadStoredUser, persistStoredUser, clearStoredUser, type StoredUser } from '../../lib/auth';

const NICKNAME_STORAGE_KEY = 'nickname';

export default function LobbyPage() {
  const router = useRouter();
  const heartbeat = useHeartbeat();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [rooms, setRooms] = useState<LobbyRoom[]>([]);
  const [roomsStatus, setRoomsStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [notifications, setNotifications] = useState<LobbyNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const apiBaseUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';
    return base.replace(/\/$/, '');
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setAuthStatus('loading');
      setError(null);
      try {
        const storedUser = loadStoredUser();
        const storedNickname =
          storedUser?.nickname ??
          (typeof window !== 'undefined' ? window.localStorage.getItem(NICKNAME_STORAGE_KEY) : null) ??
          'Guest';
        const authenticated = await ensureUser(apiBaseUrl, storedNickname);
        persistStoredUser(authenticated);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(NICKNAME_STORAGE_KEY, authenticated.nickname);
        }
        setUser(authenticated);
        setAuthStatus('ready');
      } catch (err) {
        console.error('[web] failed to ensure user on lobby load', err);
        setError('无法登录，请返回首页重试。');
        setAuthStatus('error');
      }
    };

    bootstrap();
  }, [apiBaseUrl]);

  useEffect(() => {
    if (authStatus !== 'ready') {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadRooms = async () => {
      setRoomsStatus('loading');
      try {
        const response = await fetch(`${apiBaseUrl}/lobby/rooms`, {
          signal: controller.signal,
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const payload = await response.json();
        const parsed = LobbyRoomsResponse.safeParse(payload);
        if (!parsed.success) {
          throw new Error('Invalid lobby response');
        }
        if (cancelled) {
          return;
        }
        setRooms(parsed.data.rooms);
        setNotifications(parsed.data.notifications);
        setRoomsStatus('ready');
      } catch (err) {
        if (controller.signal.aborted || cancelled) {
          return;
        }
        console.error('[web] failed to load lobby rooms', err);
        setRooms([]);
        setNotifications([]);
        setRoomsStatus('error');
      }
    };

    loadRooms();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [apiBaseUrl, authStatus]);

  const handleBackHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleLogout = useCallback(() => {
    clearStoredUser();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(NICKNAME_STORAGE_KEY);
    }
    setUser(null);
    setAuthStatus('error');
    setError('已登出，请返回首页重新登录。');
  }, []);

  const renderRoomStatus = (status: LobbyRoom['status']) => {
    switch (status) {
      case 'waiting':
        return '等待加入';
      case 'in-progress':
        return '对局中';
      case 'full':
        return '房间已满';
      default:
        return status;
    }
  };

  const indicatorColor = (() => {
    if (heartbeat.status === 'online') return '#22c55e';
    if (heartbeat.status === 'degraded' || heartbeat.status === 'connecting') return '#facc15';
    return '#f87171';
  })();
  const roomsSummaryMessage = (() => {
    if (roomsStatus === 'loading') return '正在加载房间列表…';
    if (roomsStatus === 'ready' && rooms.length > 0) return `共 ${rooms.length} 个房间`;
    if (roomsStatus === 'ready' && rooms.length === 0) return '当前没有开放的房间';
    return null;
  })();

  return (
    <main
      style={{
        minHeight: '100dvh',
        boxSizing: 'border-box',
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        background: '#0f172a',
        color: '#e2e8f0',
        padding: '2rem',
        gap: '2rem'
      }}
    >
      <header
        data-testid="lobby-user-summary"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1rem 1.25rem',
          background: 'rgba(15, 23, 42, 0.78)',
          borderRadius: 24,
          border: '1px solid rgba(148, 163, 184, 0.28)',
          boxShadow: '0 32px 80px rgba(15, 23, 42, 0.55)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleBackHome}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: 999,
              background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
              color: '#0f172a',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 18px 40px rgba(99, 102, 241, 0.35)'
            }}
          >
            返回首页
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: 999,
              border: '1px solid rgba(248, 113, 113, 0.45)',
              background: 'rgba(248, 113, 113, 0.08)',
              color: '#fda4af',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            登出
          </button>
        </div>
        <div style={{ display: 'grid', gap: '0.35rem', minWidth: 0 }}>
          {authStatus === 'loading' && <span>正在登录…</span>}
          {authStatus === 'ready' && user && (
            <>
              <span style={{ fontWeight: 600 }}>已登录：{user.nickname}</span>
              <span style={{ fontSize: '0.95rem', opacity: 0.7 }}>用户编号：{user.id}</span>
            </>
          )}
          {authStatus === 'error' && error && (
            <span style={{ color: '#fca5a5' }}>{error}</span>
          )}
        </div>
        <div style={{ display: 'grid', gap: '0.35rem', textAlign: 'right' }}>
          <span style={{ fontWeight: 600 }}>房间总数：{rooms.length}</span>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
            {notifications.map(notification => (
              <span
                key={notification.id}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 999,
                  fontSize: '0.85rem',
                  background:
                    notification.tone === 'warning'
                      ? 'rgba(248, 113, 113, 0.18)'
                      : 'rgba(96, 165, 250, 0.18)',
                  color: notification.tone === 'warning' ? '#fecaca' : '#bae6fd',
                  border:
                    notification.tone === 'warning'
                      ? '1px solid rgba(248, 113, 113, 0.35)'
                      : '1px solid rgba(96, 165, 250, 0.45)'
                }}
              >
                {notification.message}
              </span>
            ))}
            {notifications.length === 0 && <span style={{ opacity: 0.7 }}>暂无通知</span>}
          </div>
        </div>
      </header>

      <section
        style={{
          display: 'grid',
          gap: '1.5rem',
          padding: '1.5rem',
          background: 'rgba(15, 23, 42, 0.78)',
          borderRadius: 24,
          border: '1px solid rgba(148, 163, 184, 0.28)',
          boxShadow: '0 32px 80px rgba(15, 23, 42, 0.35)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', minHeight: '1.25rem' }}>
          {roomsSummaryMessage && (
            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{roomsSummaryMessage}</span>
          )}
        </div>

        {roomsStatus === 'loading' ? (
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.75 }}>正在准备房间列表…</div>
        ) : roomsStatus === 'ready' && rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.75 }}>敬请期待新牌桌开放！</div>
        ) : roomsStatus === 'error' ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#fca5a5' }}>暂时无法获取房间信息。</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: '1.25rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))'
            }}
          >
            {rooms.map(room => (
              <article
                key={room.id}
                data-testid="lobby-room-card"
                style={{
                  display: 'grid',
                  gap: '0.75rem',
                  padding: '1.25rem',
                  borderRadius: 18,
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  boxShadow: '0 18px 48px rgba(15, 23, 42, 0.45)'
                }}
              >
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>房间 {room.id}</h3>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: 999,
                      fontSize: '0.8rem',
                      background:
                        room.status === 'waiting'
                          ? 'rgba(34, 197, 94, 0.18)'
                          : room.status === 'in-progress'
                          ? 'rgba(234, 179, 8, 0.18)'
                          : 'rgba(248, 113, 113, 0.18)',
                      color:
                        room.status === 'waiting'
                          ? '#4ade80'
                          : room.status === 'in-progress'
                          ? '#facc15'
                          : '#fca5a5'
                    }}
                  >
                    {renderRoomStatus(room.status)}
                  </span>
                </header>
                <p style={{ margin: 0, opacity: 0.7 }}>
                  当前人数：{room.players} / {room.capacity}
                </p>
                <button
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 12,
                    border: 'none',
                    fontWeight: 600,
                    cursor: room.status === 'full' ? 'not-allowed' : 'pointer',
                    background:
                      room.status === 'full'
                        ? 'rgba(148, 163, 184, 0.25)'
                        : 'linear-gradient(135deg, #38bdf8, #6366f1)',
                    color: room.status === 'full' ? '#94a3b8' : '#0f172a',
                    opacity: room.status === 'full' ? 0.6 : 1
                  }}
                  disabled={room.status === 'full'}
                >
                  立即加入
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.25rem',
          background: 'rgba(15, 23, 42, 0.78)',
          borderRadius: 18,
          border: '1px solid rgba(148, 163, 184, 0.28)'
        }}
      >
        <div
          data-testid="lobby-connection-indicator"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: indicatorColor,
              boxShadow: `0 0 16px ${indicatorColor}`
            }}
          />
          <span>
            {heartbeat.status === 'online'
              ? '连接正常'
              : heartbeat.status === 'degraded'
              ? '连接不稳定'
              : heartbeat.status === 'connecting'
              ? '正在连接…'
              : '连接已断开'}
          </span>
        </div>
        {heartbeat.latencyMs !== null && (
          <span style={{ fontSize: '0.9rem', opacity: 0.75 }}>
            当前延迟：{heartbeat.latencyMs.toFixed(0)} ms
          </span>
        )}
      </footer>
    </main>
  );
}
