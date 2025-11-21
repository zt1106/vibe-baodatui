'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AVATAR_FILENAMES } from '@shared/avatars';
import {
  LobbyRoomsResponse,
  RegisterUserResponse as RegisterUserResponseSchema,
  TablePrepareResponse as TablePrepareResponseSchema,
  UpdateNicknameResponse as UpdateNicknameResponseSchema
} from '@shared/messages';
import type { LobbyNotification, LobbyRoom, TablePrepareResponse } from '@shared/messages';

import { LobbyRoomsPanel } from '../../components/lobby/LobbyRoomsPanel';
import { LobbyTopBar } from '../../components/lobby/LobbyTopBar';
import { useHeartbeat } from '../../lib/heartbeat';
import { ensureUser, loadStoredUser, persistStoredUser, NICKNAME_STORAGE_KEY, type StoredUser } from '../../lib/auth';
import { getApiBaseUrl, fetchJson } from '../../lib/api';
import type { AsyncStatus } from '../../lib/types';
import { generateRandomChineseName } from '../../lib/nickname';

const apiBaseUrl = getApiBaseUrl();

export default function LobbyPage() {
  const router = useRouter();
  const heartbeat = useHeartbeat();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AsyncStatus>('idle');
  const [rooms, setRooms] = useState<LobbyRoom[]>([]);
  const [roomsStatus, setRoomsStatus] = useState<AsyncStatus>('idle');
  const [notifications, setNotifications] = useState<LobbyNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomActionError, setRoomActionError] = useState<string | null>(null);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [avatarSelection, setAvatarSelection] = useState<string | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [avatarUpdateError, setAvatarUpdateError] = useState<string | null>(null);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameDialogError, setNameDialogError] = useState<string | null>(null);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  // derive once per module; env never changes at runtime

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
        const payload = await fetchJson<unknown>(`${apiBaseUrl}/lobby/rooms`, {
          signal: controller.signal,
          credentials: 'include'
        });
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
      const payload = await fetchJson<unknown>(`${apiBaseUrl}/tables`, {
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
      const payload = await fetchJson<unknown>(`${apiBaseUrl}/auth/avatar`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, avatar: avatarSelection })
      });
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

  const handleOpenNameDialog = useCallback(() => {
    if (!user) return;
    setNameDraft(user.nickname);
    setNameDialogError(null);
    setIsNameDialogOpen(true);
  }, [user]);

  const handleCloseNameDialog = useCallback(() => {
    setNameDraft('');
    setNameDialogError(null);
    setIsNameDialogOpen(false);
  }, []);

  const handleConfirmName = useCallback(async () => {
    if (!user) return;
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameDialogError('昵称不能为空。');
      return;
    }
    if (trimmed === user.nickname) {
      setNameDialogError('请输入不同的昵称。');
      return;
    }
    setNameDialogError(null);
    setIsUpdatingName(true);
    try {
      const response = await fetch(`${apiBaseUrl}/auth/nickname`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, nickname: trimmed })
      });
      if (!response.ok) {
        if (response.status === 409) {
          setNameDialogError('该昵称已被占用。');
          return;
        }
        throw new Error(`Request failed with status ${response.status}`);
      }
      const payload = await response.json();
      const parsed = UpdateNicknameResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error('Invalid nickname response');
      }
      persistStoredUser(parsed.data.user);
      setUser(parsed.data.user);
      setIsNameDialogOpen(false);
    } catch (err) {
      console.error('[web] failed to update nickname', err);
      setNameDialogError('更换昵称失败，请稍后再试。');
    } finally {
      setIsUpdatingName(false);
    }
  }, [apiBaseUrl, nameDraft, persistStoredUser, user]);

  const handleEnterGame = useCallback((roomId: string) => {
    router.push(`/game/${encodeURIComponent(roomId)}/prepare`);
  }, [router]);

  const indicatorColor = (() => {
    if (heartbeat.status === 'online') return '#22c55e';
    if (heartbeat.status === 'degraded' || heartbeat.status === 'connecting') return '#facc15';
    return '#f87171';
  })();
  const trimmedName = nameDraft.trim();
  const isNameSubmitDisabled =
    isUpdatingName || !trimmedName || Boolean(user && trimmedName === user.nickname);

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
      <LobbyTopBar
        roomsCount={rooms.length}
        notifications={notifications}
        user={user}
        authStatus={authStatus}
        isCreatingRoom={isCreatingRoom}
        error={error}
        onBackHome={handleBackHome}
        onCreateRoom={handleCreateRoom}
        onOpenAvatarDialog={handleOpenAvatarDialog}
        onOpenNameDialog={handleOpenNameDialog}
      />

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

      <LobbyRoomsPanel rooms={rooms} status={roomsStatus} onEnterRoom={handleEnterGame} />

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
      {isNameDialogOpen && (
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
            aria-label="更改昵称"
            style={{
              width: 'min(420px, 90vw)',
              background: '#0b1221',
              borderRadius: 24,
              padding: '1.5rem',
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
              <h3 style={{ margin: 0 }}>更改昵称</h3>
              <button
                type="button"
                onClick={handleCloseNameDialog}
                aria-label="关闭昵称对话框"
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
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontWeight: 600 }}>昵称</span>
              <input
                value={nameDraft}
                onChange={event => setNameDraft(event.target.value)}
                maxLength={32}
                autoFocus
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 12,
                  border: '1px solid rgba(148, 163, 184, 0.5)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#e2e8f0',
                  fontSize: '1rem'
                }}
              />
            </label>
            {nameDialogError && (
              <span style={{ color: '#fca5a5', fontSize: '0.9rem' }}>{nameDialogError}</span>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleCloseNameDialog}
                disabled={isUpdatingName}
                style={{
                  padding: '0.6rem 1.1rem',
                  borderRadius: 999,
                  border: '1px solid rgba(148, 163, 184, 0.5)',
                  background: 'transparent',
                  color: '#e2e8f0',
                  cursor: isUpdatingName ? 'not-allowed' : 'pointer'
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmName}
                disabled={isNameSubmitDisabled}
                style={{
                  padding: '0.6rem 1.3rem',
                  borderRadius: 999,
                  border: 'none',
                  background: isNameSubmitDisabled
                    ? 'rgba(148, 163, 184, 0.35)'
                    : 'linear-gradient(135deg, #38bdf8, #6366f1)',
                  color: isNameSubmitDisabled ? '#94a3b8' : '#0f172a',
                  fontWeight: 600,
                  cursor: isNameSubmitDisabled ? 'not-allowed' : 'pointer'
                }}
              >
                {isUpdatingName ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
