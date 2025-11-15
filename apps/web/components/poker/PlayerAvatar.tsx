'use client';

import type { CSSProperties, ReactNode } from 'react';

import styles from './PlayerAvatar.module.css';

export type PlayerAvatarTone = 'neutral' | 'success' | 'warning' | 'danger';
export type PlayerAvatarInfoAccent = 'muted' | 'strong';

export type PlayerAvatarInfo = {
  label: string;
  value: ReactNode;
  accent?: PlayerAvatarInfoAccent;
};

export type PlayerAvatarProps = {
  playerName: string;
  avatarUrl?: string;
  status?: string;
  statusTone?: PlayerAvatarTone;
  score?: number | string;
  scoreLabel?: string;
  teamName?: string;
  teamLabel?: string;
  infoRows?: PlayerAvatarInfo[];
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

function formatScoreValue(score: number | string) {
  return typeof score === 'number' ? score.toLocaleString() : score;
}

export function PlayerAvatar({
  playerName,
  avatarUrl,
  status,
  statusTone = 'neutral',
  score,
  scoreLabel = 'Score',
  teamName,
  teamLabel = 'Team',
  infoRows,
  size = 64,
  className
}: PlayerAvatarProps) {
  const resolvedSize = normalizeSize(size);
  const rootStyle = { '--player-avatar-size': resolvedSize } as CSSProperties;
  const toneClassName = toneClassMap[statusTone] ?? toneClassMap.neutral;
  const initials = playerName.trim().charAt(0) || '？';

  const builtInInfo: PlayerAvatarInfo[] = [];

  if (teamName) {
    builtInInfo.push({
      label: teamLabel,
      value: teamName,
      accent: 'muted'
    });
  }

  if (score !== undefined && score !== null) {
    builtInInfo.push({
      label: scoreLabel,
      value: formatScoreValue(score),
      accent: 'strong'
    });
  }

  const combinedInfo = [...builtInInfo, ...(infoRows ?? [])];

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
      {combinedInfo.length > 0 && (
        <ul className={styles.infoList}>
          {combinedInfo.map((info, index) => {
            const accentClass =
              info.accent === 'strong'
                ? styles.infoValueStrong
                : info.accent === 'muted'
                ? styles.infoValueMuted
                : '';
            return (
              <li key={`${info.label}-${index}`} className={styles.infoRow}>
                <span className={styles.infoLabel}>{info.label}</span>
                <span className={[styles.infoValue, accentClass].filter(Boolean).join(' ')}>
                  {info.value}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
