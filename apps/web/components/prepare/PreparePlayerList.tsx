'use client';

import type { TablePlayer } from '@shared/messages';

import type { AsyncStatus } from '../../lib/types';

export type PrepareSeat = {
  seatNumber: number;
  player: TablePlayer | null;
};

export type PreparePlayerListProps = {
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

export function PreparePlayerList({
  seats,
  playerCount,
  capacity,
  status,
  error,
  isHost,
  hostUserId = null,
  currentUserId = null,
  onKickPlayer
}: PreparePlayerListProps) {
  return (
    <section
      style={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gap: '1rem',
        padding: '1.2rem',
        borderRadius: 24,
        border: '1px solid rgba(148, 163, 184, 0.25)',
        background: 'rgba(15, 23, 42, 0.82)',
        boxShadow: '0 24px 60px rgba(15, 23, 42, 0.45)'
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>玩家列表</h2>
          <p style={{ margin: '0.25rem 0 0', opacity: 0.75 }}>
            当前 {playerCount} / {capacity ?? '—'} 名玩家
          </p>
        </div>
      </header>

      {status === 'loading' && <div style={{ opacity: 0.7 }}>正在同步座位信息…</div>}

      {status === 'error' && error && <div style={{ color: '#fca5a5' }}>{error}</div>}

      {status === 'ready' && seats.length === 0 && (
        <div style={{ opacity: 0.7 }}>暂未有人加入，快邀请朋友一起准备吧！</div>
      )}

      {seats.length > 0 && (
        <div
          data-testid="prepare-player-list"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1rem',
            overflowY: 'auto',
            paddingRight: '0.25rem'
          }}
        >
          {seats.map(({ seatNumber, player }) => (
            <article
              key={seatNumber}
              style={{
                borderRadius: 18,
                border: '1px solid rgba(148, 163, 184, 0.25)',
                padding: '1rem',
                background: player ? 'rgba(34, 197, 94, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                display: 'grid',
                gap: '0.35rem',
                boxShadow: '0 16px 36px rgba(15, 23, 42, 0.35)'
              }}
            >
              <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>座位 {seatNumber}</span>
              {player ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 12,
                          overflow: 'hidden',
                          border: '1px solid rgba(148, 163, 184, 0.45)'
                        }}
                      >
                        <img
                          src={`/avatars/${player.avatar}`}
                          alt={`${player.nickname} 头像`}
                          width={34}
                          height={34}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <strong style={{ fontSize: '1.05rem' }}>{player.nickname}</strong>
                    </div>
                    {hostUserId === player.userId && (
                      <span
                        style={{
                          padding: '0.1rem 0.5rem',
                          borderRadius: 999,
                          fontSize: '0.75rem',
                          background: 'rgba(234, 179, 8, 0.2)',
                          color: '#facc15'
                        }}
                      >
                        房主
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.9rem', opacity: 0.75 }}>ID：{player.userId}</span>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      color: player.prepared ? '#4ade80' : '#f87171',
                      fontWeight: 600
                    }}
                  >
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
                        style={{
                          marginTop: '0.35rem',
                          padding: '0.45rem 0.9rem',
                          borderRadius: 10,
                          border: '1px solid rgba(248, 113, 113, 0.5)',
                          background: 'rgba(248, 113, 113, 0.12)',
                          color: '#fecaca',
                          cursor: 'pointer'
                        }}
                      >
                        移出房间
                      </button>
                    )}
                </>
              ) : (
                <span style={{ opacity: 0.6 }}>空座位</span>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
