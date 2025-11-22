import { useEffect, useRef, useState } from 'react';

import type { LobbyNotification } from '@shared/messages';
import type { GameVariantDefinition, GameVariantId } from '@shared/variants';

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
  onCreateRoom?: (variantId: GameVariantId) => void;
  onOpenAvatarDialog?: () => void;
  onOpenNameDialog?: () => void;
  variants?: GameVariantDefinition[];
  selectedVariantId?: GameVariantId;
  onSelectVariant?: (variantId: GameVariantId) => void;
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
  onOpenNameDialog = noop,
  variants = [],
  selectedVariantId,
  onSelectVariant = noop
}: LobbyTopBarProps) {
  const isCreateDisabled = isCreatingRoom || authStatus !== 'ready';
  const selectedVariant = variants.find(variant => variant.id === selectedVariantId) ?? variants[0];
  const variantId = selectedVariant?.id;
  const [isVariantMenuOpen, setIsVariantMenuOpen] = useState(false);
  const variantMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (variantMenuRef.current && !variantMenuRef.current.contains(event.target as Node)) {
        setIsVariantMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        <div style={{ display: 'grid', gap: '0.25rem', position: 'relative' }} ref={variantMenuRef}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>玩法</span>
          <button
            type="button"
            data-testid="variant-select"
            onClick={() => setIsVariantMenuOpen(open => !open)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: 12,
              border: '1px solid rgba(148, 163, 184, 0.35)',
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#e2e8f0',
              minWidth: 150,
              maxWidth: 200,
              cursor: 'pointer',
              boxShadow: '0 10px 28px rgba(15, 23, 42, 0.4)'
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedVariant ? selectedVariant.name : '选择玩法'}
            </span>
            <span aria-hidden="true" style={{ opacity: 0.6 }}>
              ▼
            </span>
          </button>
          {isVariantMenuOpen && (
            <div
              role="listbox"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '0.25rem',
                background: 'rgba(15, 23, 42, 0.95)',
                borderRadius: 12,
                border: '1px solid rgba(148, 163, 184, 0.28)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
                minWidth: 220,
                maxWidth: 260,
                zIndex: 20,
                overflow: 'hidden'
              }}
            >
              {variants.map(variant => (
                <button
                  key={variant.id}
                  role="option"
                  aria-selected={variant.id === variantId}
                  onClick={() => {
                    onSelectVariant(variant.id);
                    setIsVariantMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.75rem 0.85rem',
                    background: variant.id === variantId ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                    color: '#e2e8f0',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'grid',
                    gap: '0.2rem'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{variant.name}</span>
                  <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{variant.description}</span>
                </button>
              ))}
            </div>
          )}
          {selectedVariant && (
            <span
              data-testid="variant-description"
              style={{
                fontSize: '0.85rem',
                opacity: 0.75,
                paddingLeft: '0.25rem',
                maxWidth: 240,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {selectedVariant.description}
            </span>
          )}
        </div>
        <button
          type="button"
          data-testid="create-room-button"
          onClick={() => {
            if (!variantId) return;
            onCreateRoom(variantId);
          }}
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
