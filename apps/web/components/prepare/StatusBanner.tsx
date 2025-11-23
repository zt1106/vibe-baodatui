'use client';

import type { CSSProperties } from 'react';

import type { AsyncStatus } from '../../lib/types';
import styles from './StatusBanner.module.css';

type Tone = {
  label: string;
  background: string;
  color: string;
};

type StatusBannerProps = {
  tableId: string;
  tone: Tone | null;
  variantName?: string | null;
  variantDescription?: string | null;
  user?: { nickname: string; id: number } | null;
  host?: { avatar: string; nickname: string; userId: number } | null;
  authStatus: AsyncStatus;
  authError?: string | null;
  onLeave: () => void;
};

export function StatusBanner({
  tableId,
  tone,
  variantName,
  variantDescription,
  user = null,
  host = null,
  authStatus,
  authError,
  onLeave
}: StatusBannerProps) {
  const toneStyle = tone
    ? ({ '--tone-bg': tone.background, '--tone-color': tone.color } as CSSProperties)
    : undefined;

  return (
    <header className={styles.banner}>
      <div className={styles.info}>
        <div className={styles.headingRow}>
          <h1 className={styles.title}>牌局准备</h1>
          {tone && (
            <span className={styles.tone} style={toneStyle}>
              {tone.label}
            </span>
          )}
        </div>
        <span data-testid="room-code" className={styles.code}>
          房间编号：{tableId || '未知'}
        </span>
        {variantName && (
          <span className={styles.muted}>
            玩法：{variantName}
            {variantDescription ? `（${variantDescription}）` : ''}
          </span>
        )}
        {user && (
          <span className={styles.muted}>
            当前用户：{user.nickname}（ID {user.id}）
          </span>
        )}
        {host && (
          <div className={styles.hostRow}>
            <div className={styles.hostAvatar}>
              <img
                src={`/avatars/${host.avatar}`}
                alt={`${host.nickname} 头像`}
                width={32}
                height={32}
                loading="lazy"
              />
            </div>
            <span className={styles.muted}>
              房主：{host.nickname}（ID {host.userId}）
            </span>
          </div>
        )}
        {authStatus === 'loading' && <span className={styles.subtle}>正在验证用户身份…</span>}
        {authStatus === 'error' && authError && <span className={styles.error}>{authError}</span>}
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={onLeave} className={styles.leaveButton}>
          离开房间
        </button>
      </div>
    </header>
  );
}
