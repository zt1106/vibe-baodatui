'use client';

import type { LobbyRoom } from '@shared/messages';

import type { AsyncStatus } from '../../lib/types';
import styles from './LobbyRoomsPanel.module.css';

export type LobbyRoomsPanelProps = {
  rooms: LobbyRoom[];
  status: AsyncStatus;
  onEnterRoom?: (roomId: string) => void;
};

const statusToneMap: Record<LobbyRoom['status'], { label: string; badgeClass: string }> = {
  waiting: {
    label: '等待加入',
    badgeClass: 'badgeWaiting'
  },
  'in-progress': {
    label: '对局中',
    badgeClass: 'badgeInProgress'
  },
  full: {
    label: '房间已满',
    badgeClass: 'badgeFull'
  }
};

export function LobbyRoomsPanel({ rooms, status, onEnterRoom }: LobbyRoomsPanelProps) {
  const showEmptyState = status === 'ready' && rooms.length === 0;

  return (
    <section className={styles.panel}>
      {status === 'loading' ? (
        <div className={styles.state}>正在准备房间列表…</div>
      ) : showEmptyState ? (
        <div className={styles.state}>敬请期待新牌桌开放！</div>
      ) : status === 'error' ? (
        <div className={`${styles.state} ${styles.error}`}>暂时无法获取房间信息。</div>
      ) : (
        <div className={styles.rooms}>
          {rooms.map(room => {
            const tone = statusToneMap[room.status];
            const isRoomFull = room.status === 'full';
            return (
              <article key={room.id} data-testid="lobby-room-card" className={styles.card}>
                <header className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>房间 {room.id}</h3>
                  <span className={`${styles.badge} ${styles[tone.badgeClass]}`}>
                    {tone.label}
                  </span>
                </header>
                <div className={styles.meta}>
                  <span className={styles.variant}>玩法：{room.variant.name}</span>
                  <span className={styles.description}>{room.variant.description}</span>
                </div>
                <div className={styles.cardFooter}>
                  <span>
                    {room.players} / {room.capacity}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isRoomFull) return;
                      onEnterRoom?.(room.id);
                    }}
                    disabled={isRoomFull}
                    className={`${styles.joinButton} ${isRoomFull ? styles.joinDisabled : ''}`}
                  >
                    {isRoomFull ? '房间已满' : '加入房间'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
