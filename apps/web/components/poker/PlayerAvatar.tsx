'use client';

import type { CSSProperties } from 'react';

import styles from './PlayerAvatar.module.css';

export type PlayerAvatarTone = 'neutral' | 'success' | 'warning' | 'danger';

export type PlayerAvatarProps = {
  playerName: string;
  avatarUrl?: string;
  status?: string;
  statusTone?: PlayerAvatarTone;
  size?: number | string;
  className?: string;
};

const toneClassMap: Record<PlayerAvatarTone, string> = {
  neutral: styles.statusNeutral,
  success: styles.statusSuccess,
  warning: styles.statusWarning,
  danger: styles.statusDanger
};

function normalizeSize(size: number | string | undefined) {
  if (typeof size === 'number') {
    return `${size}px`;
  }
  if (typeof size === 'string' && size.trim().length > 0) {
    return size;
  }
  return '64px';
}

export function PlayerAvatar({
  playerName,
  avatarUrl,
  status,
  statusTone = 'neutral',
  size = 64,
  className
}: PlayerAvatarProps) {
  const resolvedSize = normalizeSize(size);
  const rootStyle = { '--player-avatar-size': resolvedSize } as CSSProperties;
  const toneClassName = toneClassMap[statusTone] ?? toneClassMap.neutral;
  const initials = playerName.trim().charAt(0) || '？';
  const rootClassName = [styles.playerAvatarCard, className].filter(Boolean).join(' ');

  return (
    <article className={rootClassName} style={rootStyle} aria-label={`Player ${playerName}`}>
      <div className={styles.avatarRow}>
        <div className={styles.avatarImage}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={`${playerName} avatar`} />
          ) : (
            <span className={styles.avatarFallback}>{initials}</span>
          )}
        </div>
        <div className={styles.nameBlock}>
          <p className={styles.playerName}>{playerName}</p>
          {status && (
            <span className={`${styles.statusBadge} ${toneClassName}`}>{status}</span>
          )}
        </div>
      </div>
    </article>
  );
}
