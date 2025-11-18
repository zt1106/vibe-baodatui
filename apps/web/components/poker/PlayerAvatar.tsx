'use client';

import type { CSSProperties } from 'react';

import styles from './PlayerAvatar.module.css';

export type PlayerAvatarProps = {
  playerName: string;
  displayName?: string;
  avatarUrl?: string;
  size?: number | string;
  className?: string;
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
  displayName,
  avatarUrl,
  size = 64,
  className
}: PlayerAvatarProps) {
  const resolvedSize = normalizeSize(size);
  const rootStyle = { '--player-avatar-size': resolvedSize } as CSSProperties;
  const initials = playerName.trim().charAt(0) || '？';
  const rootClassName = [styles.playerAvatarCard, className].filter(Boolean).join(' ');
  const labelText = displayName && displayName.trim().length > 0 ? displayName : playerName;

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
          <p className={styles.playerName}>{labelText}</p>
        </div>
      </div>
    </article>
  );
}
