import { useEffect, useRef, useState } from 'react';

import type { LobbyNotification } from '@shared/messages';
import type { GameVariantDefinition, GameVariantId } from '@shared/variants';

import type { AsyncStatus } from '../../lib/types';
import styles from './LobbyTopBar.module.css';

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
    <header data-testid="lobby-user-summary" className={styles.topBar}>
      <div className={styles.controls}>
        <button type="button" onClick={onBackHome} className={styles.backButton}>
          返回首页
        </button>
        <div className={styles.variantGroup} ref={variantMenuRef}>
          <span className={styles.variantLabel}>玩法</span>
          <button
            type="button"
            data-testid="variant-select"
            onClick={() => setIsVariantMenuOpen(open => !open)}
            className={styles.variantButton}
          >
            <span className={styles.variantValue}>
              {selectedVariant ? selectedVariant.name : '选择玩法'}
            </span>
            <span aria-hidden="true" className={styles.caret}>
              ▼
            </span>
          </button>
          {isVariantMenuOpen && (
            <div role="listbox" className={styles.variantMenu}>
              {variants.map(variant => (
                <button
                  key={variant.id}
                  role="option"
                  aria-selected={variant.id === variantId}
                  onClick={() => {
                    onSelectVariant(variant.id);
                    setIsVariantMenuOpen(false);
                  }}
                  className={`${styles.variantOption} ${
                    variant.id === variantId ? styles.variantOptionActive : ''
                  }`}
                >
                  <span className={styles.variantName}>{variant.name}</span>
                  <span className={styles.variantDescription}>{variant.description}</span>
                </button>
              ))}
            </div>
          )}
          {selectedVariant && (
            <span data-testid="variant-description" className={styles.selectedVariantDescription}>
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
          className={styles.createButton}
        >
          {isCreatingRoom ? '创建中…' : '创建房间'}
        </button>
      </div>
      <div className={styles.userArea}>
        {authStatus === 'loading' && <span className={styles.statusText}>正在登录…</span>}
        {authStatus === 'ready' && user && (
          <div className={styles.userWrapper}>
            <button type="button" onClick={onOpenAvatarDialog} className={styles.avatarButton}>
              <img
                src={`/avatars/${user.avatar}`}
                alt={`${user.nickname} 头像`}
                width={44}
                height={44}
                loading="lazy"
                className={styles.avatarImage}
              />
            </button>
            <div className={styles.userMeta}>
              <div className={styles.nicknameRow}>
                <span className={styles.nicknameLabel}>已登录：{user.nickname}</span>
                <button
                  type="button"
                  onClick={onOpenNameDialog}
                  aria-label="更改昵称"
                  className={styles.nameEditButton}
                >
                  <span aria-hidden="true" className={styles.icon}>
                    ✏️
                  </span>
                </button>
              </div>
              <span className={styles.userId}>用户编号：{user.id}</span>
            </div>
          </div>
        )}
        {authStatus === 'error' && error && <span className={styles.errorText}>{error}</span>}
      </div>
      <div className={styles.summary}>
        <span className={styles.roomsCount}>房间总数：{roomsCount}</span>
        <div className={styles.notifications}>
          {notifications.map(notification => (
            <span
              key={notification.id}
              className={`${styles.notification} ${
                notification.tone === 'warning' ? styles.notificationWarning : styles.notificationInfo
              }`}
            >
              {notification.message}
            </span>
          ))}
          {notifications.length === 0 && <span className={styles.muted}>暂无通知</span>}
        </div>
      </div>
    </header>
  );
}
