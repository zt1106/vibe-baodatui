'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AVATAR_FILENAMES } from '@shared/avatars';
import {
  LobbyRoomsResponse,
  RegisterUserResponse as RegisterUserResponseSchema,
  TablePrepareResponse as TablePrepareResponseSchema
} from '@shared/messages';
import type { LobbyNotification, LobbyRoom, TablePrepareResponse } from '@shared/messages';

import { useHeartbeat } from '../../lib/heartbeat';
import { ensureUser, loadStoredUser, persistStoredUser, clearStoredUser, type StoredUser } from '../../lib/auth';
import { generateRandomChineseName } from '../../lib/nickname';

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
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomActionError, setRoomActionError] = useState<string | null>(null);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [avatarSelection, setAvatarSelection] = useState<string | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [avatarUpdateError, setAvatarUpdateError] = useState<string | null>(null);
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
          generateRandomChineseName();
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

  const handleCreateRoom = useCallback(async () => {
    if (isCreatingRoom) {
      return;
    }
    if (!user) {
      setRoomActionError('请先完成登录。');
      return;
    }
    setRoomActionError(null);
    setIsCreatingRoom(true);
    try {
      const response = await fetch(`${apiBaseUrl}/tables`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: {
            userId: user.id,
            nickname: user.nickname,
            avatar: user.avatar
          }
        })
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const payload = await response.json();
      const parsed = TablePrepareResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error('Invalid table payload');
      }
      const table: TablePrepareResponse = parsed.data;
      router.push(`/game/${encodeURIComponent(table.tableId)}/prepare`);
    } catch (err) {
      console.error('[web] failed to create room', err);
      setRoomActionError('创建房间失败，请稍后再试。');
    } finally {
      setIsCreatingRoom(false);
    }
  }, [apiBaseUrl, isCreatingRoom, router, user]);

  const handleOpenAvatarDialog = useCallback(() => {
    if (!user) return;
    setAvatarSelection(user.avatar);
    setAvatarUpdateError(null);
    setIsAvatarDialogOpen(true);
  }, [user]);

  const handleCloseAvatarDialog = useCallback(() => {
    setAvatarSelection(null);
    setAvatarUpdateError(null);
    setIsAvatarDialogOpen(false);
  }, []);

  const handleConfirmAvatar = useCallback(async () => {
    if (!user || !avatarSelection) {
      return;
    }
    setAvatarUpdateError(null);
    setIsUpdatingAvatar(true);
    try {
      const response = await fetch(`${apiBaseUrl}/auth/avatar`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, avatar: avatarSelection })
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const payload = await response.json();
      const parsed = RegisterUserResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error('Invalid avatar response');
      }
      persistStoredUser(parsed.data.user);
      setUser(parsed.data.user);
      setIsAvatarDialogOpen(false);
    } catch (err) {
      console.error('[web] failed to update avatar', err);
      setAvatarUpdateError('更换头像失败，请稍后再试。');
    } finally {
      setIsUpdatingAvatar(false);
    }
  }, [apiBaseUrl, avatarSelection, user, persistStoredUser]);

  const handleEnterGame = useCallback((roomId: string) => {
    router.push(`/game/${encodeURIComponent(roomId)}/prepare`);
  }, [router]);

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
  const showEmptyState = roomsStatus === 'ready' && rooms.length === 0;

  return (
    <main
      style={{
        height: '100dvh',
        boxSizing: 'border-box',
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        background: '#0f172a',
        color: '#e2e8f0',
        padding: '2rem',
        gap: '2rem',
        overflow: 'hidden'
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
            onClick={handleCreateRoom}
            disabled={isCreatingRoom || authStatus !== 'ready'}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: 999,
              border: 'none',
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              color: '#0f172a',
              fontWeight: 600,
              cursor: isCreatingRoom || authStatus !== 'ready' ? 'not-allowed' : 'pointer',
              opacity: isCreatingRoom || authStatus !== 'ready' ? 0.6 : 1,
              boxShadow: '0 18px 40px rgba(249, 115, 22, 0.35)'
            }}
          >
            {isCreatingRoom ? '创建中…' : '创建房间'}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleOpenAvatarDialog}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid rgba(148, 163, 184, 0.4)',
                  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.55)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  cursor: 'pointer',
                  background: 'transparent'
                }}
              >
                <img
                  src={`/avatars/${user.avatar}`}
                  alt={`${user.nickname} 头像`}
                  width={44}
                  height={44}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
              <div style={{ display: 'grid', gap: '0.15rem' }}>
                <span style={{ fontWeight: 600 }}>已登录：{user.nickname}</span>
                <span style={{ fontSize: '0.95rem', opacity: 0.7 }}>用户编号：{user.id}</span>
              </div>
            </div>
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

      {roomActionError && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 18,
            border: '1px solid rgba(248, 113, 113, 0.35)',
            background: 'rgba(248, 113, 113, 0.12)',
            color: '#fecaca'
          }}
        >
          {roomActionError}
        </div>
      )}

      <section
        style={{
          display: 'grid',
          gap: '1.5rem',
          padding: '1.5rem',
          background: 'rgba(15, 23, 42, 0.78)',
          borderRadius: 24,
          border: '1px solid rgba(148, 163, 184, 0.28)',
          boxShadow: '0 32px 80px rgba(15, 23, 42, 0.35)',
          overflowY: 'auto',
          minHeight: 0
        }}
      >
        {roomsStatus === 'loading' ? (
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.75 }}>正在准备房间列表…</div>
        ) : showEmptyState ? (
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.75 }}>敬请期待新牌桌开放！</div>
        ) : roomsStatus === 'error' ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#fca5a5' }}>暂时无法获取房间信息。</div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              justifyContent: 'flex-start',
              alignContent: 'flex-start'
            }}
          >
            {rooms.map(room => {
              const isRoomFull = room.status === 'full';
              return (
                <article
                  key={room.id}
                  data-testid="lobby-room-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.35rem',
                    padding: '1rem',
                    borderRadius: 14,
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    boxShadow: '0 18px 48px rgba(15, 23, 42, 0.45)',
                    width: '240px',
                    height: '100px',
                    flex: '0 0 240px'
                  }}
                >
                  <header
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>房间 {room.id}</h3>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 999,
                        fontSize: '0.75rem',
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
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                      marginTop: 'auto'
                    }}
                  >
                    <p style={{ margin: 0, opacity: 0.75, fontSize: '0.9rem' }}>
                      当前人数：{room.players} / {room.capacity}
                    </p>
                    <button
                      data-testid="enter-game-button"
                      onClick={() => {
                        if (!isRoomFull) {
                          handleEnterGame(room.id);
                        }
                      }}
                      style={{
                        padding: '0.45rem 0.95rem',
                        borderRadius: 999,
                        border: 'none',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: isRoomFull ? 'not-allowed' : 'pointer',
                        background: isRoomFull
                          ? 'rgba(148, 163, 184, 0.25)'
                          : 'linear-gradient(135deg, #38bdf8, #6366f1)',
                        color: isRoomFull ? '#94a3b8' : '#0f172a',
                        opacity: isRoomFull ? 0.6 : 1,
                        boxShadow: isRoomFull ? 'none' : '0 12px 28px rgba(56, 189, 248, 0.35)',
                        transition: 'transform 120ms ease, box-shadow 120ms ease'
                      }}
                      disabled={isRoomFull}
                    >
                      进入牌局
                    </button>
                  </div>
                </article>
              );
            })}
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
      {isAvatarDialogOpen && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 500
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="选择头像"
            style={{
              width: 'min(520px, 90vw)',
              maxHeight: '90vh',
              background: '#0b1221',
              borderRadius: 24,
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 32px 80px rgba(2, 6, 23, 0.9)'
            }}
          >
            <header
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h3 style={{ margin: 0 }}>更换头像</h3>
              <button
                type="button"
                onClick={handleCloseAvatarDialog}
                aria-label="关闭头像选择"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid rgba(148, 163, 184, 0.4)',
                  background: 'transparent',
                  color: '#e2e8f0',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </header>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                gap: '0.5rem',
                overflowY: 'auto',
                maxHeight: '60vh'
              }}
            >
              {AVATAR_FILENAMES.map(filename => {
                const isSelected = avatarSelection === filename;
                return (
                  <button
                    key={filename}
                    type="button"
                    onClick={() => setAvatarSelection(filename)}
                    aria-pressed={isSelected}
                    style={{
                      borderRadius: 12,
                      padding: 0,
                      border: isSelected ? '2px solid #38bdf8' : '2px solid transparent',
                      background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.4)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isSelected ? '0 12px 24px rgba(59, 130, 246, 0.3)' : '0 10px 24px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    <img
                      src={`/avatars/${filename}`}
                      alt=""
                      width={70}
                      height={70}
                      loading="lazy"
                      style={{ width: 70, height: 70, objectFit: 'cover' }}
                    />
                  </button>
                );
              })}
            </div>
            {avatarUpdateError && (
              <span style={{ color: '#fca5a5', fontSize: '0.9rem' }}>{avatarUpdateError}</span>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleCloseAvatarDialog}
                disabled={isUpdatingAvatar}
                style={{
                  padding: '0.6rem 1.1rem',
                  borderRadius: 999,
                  border: '1px solid rgba(148, 163, 184, 0.5)',
                  background: 'transparent',
                  color: '#e2e8f0',
                  cursor: isUpdatingAvatar ? 'not-allowed' : 'pointer'
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmAvatar}
                disabled={
                  isUpdatingAvatar ||
                  !user ||
                  !avatarSelection ||
                  avatarSelection === user.avatar
                }
                style={{
                  padding: '0.6rem 1.3rem',
                  borderRadius: 999,
                  border: 'none',
                  background:
                    isUpdatingAvatar || !avatarSelection || avatarSelection === user?.avatar
                      ? 'rgba(148, 163, 184, 0.35)'
                      : 'linear-gradient(135deg, #38bdf8, #6366f1)',
                  color: isUpdatingAvatar ? '#94a3b8' : '#0f172a',
                  fontWeight: 600,
                  cursor:
                    isUpdatingAvatar || !user || !avatarSelection || avatarSelection === user.avatar
                      ? 'not-allowed'
                      : 'pointer'
                }}
              >
                {isUpdatingAvatar ? '更新中…' : '确定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
