'use client';

import type { TablePlayer } from '@shared/messages';

import type { AsyncStatus } from '../../lib/types';
import styles from './SeatGrid.module.css';

export type PrepareSeat = {
  seatNumber: number;
  player: TablePlayer | null;
};

export type SeatGridProps = {
  seats: PrepareSeat[];
  playerCount: number;
  capacity: number | null;
  status: AsyncStatus;
  error?: string | null;
  isHost: boolean;
  hostUserId?: number | null;
  currentUserId?: number | null;
  onKickPlayer?: (userId: number) => void;
};

export function SeatGrid({
  seats,
  playerCount,
  capacity,
  status,
  error,
  isHost,
  hostUserId = null,
  currentUserId = null,
  onKickPlayer
}: SeatGridProps) {
  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>玩家列表</h2>
          <p className={styles.subtitle}>
            当前 {playerCount} / {capacity ?? '—'} 名玩家
          </p>
        </div>
      </header>

      {status === 'loading' && <div className={styles.message}>正在同步座位信息…</div>}

      {status === 'error' && error && <div className={styles.error}>{error}</div>}

      {status === 'ready' && seats.length === 0 && (
        <div className={styles.message}>暂未有人加入，快邀请朋友一起准备吧！</div>
      )}

      {seats.length > 0 && (
        <div className={styles.grid} data-testid="prepare-player-list">
          {seats.map(({ seatNumber, player }) => (
            <article
              key={seatNumber}
              className={`${styles.card} ${player ? styles.cardFilled : styles.cardEmpty}`}
            >
              <span className={styles.seatLabel}>座位 {seatNumber}</span>
              {player ? (
                <>
                  <div className={styles.cardHeader}>
                    <div className={styles.avatarRow}>
                      <div className={styles.avatar}>
                        <img
                          src={`/avatars/${player.avatar}`}
                          alt={`${player.nickname} 头像`}
                          width={28}
                          height={28}
                          loading="lazy"
                        />
                      </div>
                      <strong className={styles.playerName}>{player.nickname}</strong>
                    </div>
                    {hostUserId === player.userId && <span className={styles.hostBadge}>房主</span>}
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={player.prepared ? styles.statusReady : styles.statusPending}>
                      {player.prepared ? '已准备' : '未准备'}
                    </span>
                    {isHost &&
                      player.userId !== currentUserId &&
                      player.userId !== hostUserId &&
                      typeof player.userId === 'number' &&
                      onKickPlayer && (
                        <button
                          type="button"
                          onClick={() => onKickPlayer(player.userId)}
                          className={styles.kickButton}
                        >
                          移出
                        </button>
                      )}
                  </div>
                </>
              ) : (
                <span className={styles.emptySeat}>空座位</span>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
