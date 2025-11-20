'use client';

import type { LobbyRoom } from '@shared/messages';

import type { AsyncStatus } from '../../lib/types';

export type LobbyRoomsPanelProps = {
  rooms: LobbyRoom[];
  status: AsyncStatus;
  onEnterRoom?: (roomId: string) => void;
};

const statusToneMap: Record<LobbyRoom['status'], { label: string; background: string; color: string }> = {
  waiting: {
    label: '等待加入',
    background: 'rgba(34, 197, 94, 0.18)',
    color: '#4ade80'
  },
  'in-progress': {
    label: '对局中',
    background: 'rgba(234, 179, 8, 0.18)',
    color: '#facc15'
  },
  full: {
    label: '房间已满',
    background: 'rgba(248, 113, 113, 0.18)',
    color: '#fca5a5'
  }
};

export function LobbyRoomsPanel({ rooms, status, onEnterRoom }: LobbyRoomsPanelProps) {
  const showEmptyState = status === 'ready' && rooms.length === 0;

  return (
    <section
      style={{
        display: 'grid',
        gap: '1.5rem',
        padding: '1.5rem',
        background: 'rgba(15, 23, 42, 0.78)',
        borderRadius: 24,
        border: '1px solid rgba(148, 163, 184, 0.28)',
        boxShadow: '0 32px 80px rgba(15, 23, 42, 0.35)',
        overflowY: 'auto',
        minHeight: 0
      }}
    >
      {status === 'loading' ? (
        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.75 }}>正在准备房间列表…</div>
      ) : showEmptyState ? (
        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.75 }}>敬请期待新牌桌开放！</div>
      ) : status === 'error' ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#fca5a5' }}>暂时无法获取房间信息。</div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'flex-start',
            alignContent: 'flex-start'
          }}
        >
          {rooms.map(room => {
            const tone = statusToneMap[room.status];
            const isRoomFull = room.status === 'full';
            return (
              <article
                key={room.id}
                data-testid="lobby-room-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.35rem',
                  padding: '1rem',
                  borderRadius: 14,
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  boxShadow: '0 18px 48px rgba(15, 23, 42, 0.45)',
                  width: '240px',
                  height: '100px',
                  flex: '0 0 240px'
                }}
              >
                <header
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>房间 {room.id}</h3>
                  <span
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      background: tone.background,
                      color: tone.color
                    }}
                  >
                    {tone.label}
                  </span>
                </header>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>
                    {room.players} / {room.capacity}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isRoomFull) return;
                      onEnterRoom?.(room.id);
                    }}
                    disabled={isRoomFull}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: 10,
                      border: 'none',
                      background: isRoomFull
                        ? 'rgba(148, 163, 184, 0.2)'
                        : 'linear-gradient(135deg, #38bdf8, #6366f1)',
                      color: isRoomFull ? '#94a3b8' : '#0f172a',
                      fontWeight: 600,
                      cursor: isRoomFull ? 'not-allowed' : 'pointer',
                      opacity: isRoomFull ? 0.6 : 1,
                      boxShadow: isRoomFull ? 'none' : '0 12px 28px rgba(56, 189, 248, 0.35)'
                    }}
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
