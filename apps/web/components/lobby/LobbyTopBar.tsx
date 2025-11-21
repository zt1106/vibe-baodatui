import type { LobbyNotification } from '@shared/messages';

import type { AsyncStatus } from '../../lib/types';

export type LobbyTopBarUser = {
  id: number;
  nickname: string;
  avatar: string;
};

export type LobbyTopBarProps = {
  roomsCount: number;
  notifications: LobbyNotification[];
  user: LobbyTopBarUser | null;
  authStatus: AsyncStatus;
  isCreatingRoom: boolean;
  error?: string | null;
  onBackHome?: () => void;
  onCreateRoom?: () => void;
  onOpenAvatarDialog?: () => void;
  onOpenNameDialog?: () => void;
};

const noop = () => {};

export function LobbyTopBar({
  roomsCount,
  notifications,
  user,
  authStatus,
  isCreatingRoom,
  error,
  onBackHome = noop,
  onCreateRoom = noop,
  onOpenAvatarDialog = noop,
  onOpenNameDialog = noop
}: LobbyTopBarProps) {
  const isCreateDisabled = isCreatingRoom || authStatus !== 'ready';

  return (
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
          type="button"
          onClick={onBackHome}
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
          type="button"
          data-testid="create-room-button"
          onClick={onCreateRoom}
          disabled={isCreateDisabled}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: 999,
            border: 'none',
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            color: '#0f172a',
            fontWeight: 600,
            cursor: isCreateDisabled ? 'not-allowed' : 'pointer',
            opacity: isCreateDisabled ? 0.6 : 1,
            boxShadow: '0 18px 40px rgba(249, 115, 22, 0.35)'
          }}
        >
          {isCreatingRoom ? '创建中…' : '创建房间'}
        </button>
      </div>
      <div style={{ display: 'grid', gap: '0.35rem', minWidth: 0 }}>
        {authStatus === 'loading' && <span>正在登录…</span>}
        {authStatus === 'ready' && user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onOpenAvatarDialog}
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
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontWeight: 600 }}>已登录：{user.nickname}</span>
                <button
                  type="button"
                  onClick={onOpenNameDialog}
                  aria-label="更改昵称"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: '1px solid rgba(148, 163, 184, 0.5)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#e2e8f0',
                    fontSize: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <span aria-hidden="true" style={{ lineHeight: 1 }}>
                    ✏️
                  </span>
                </button>
              </div>
              <span style={{ fontSize: '0.95rem', opacity: 0.7 }}>用户编号：{user.id}</span>
            </div>
          </div>
        )}
        {authStatus === 'error' && error && <span style={{ color: '#fca5a5' }}>{error}</span>}
      </div>
      <div style={{ display: 'grid', gap: '0.35rem', textAlign: 'right' }}>
        <span style={{ fontWeight: 600 }}>房间总数：{roomsCount}</span>
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
  );
}
