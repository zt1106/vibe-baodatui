'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useHeartbeat } from '../lib/heartbeat';
import { generateRandomChineseName } from '../lib/nickname';

const NICKNAME_STORAGE_KEY = 'nickname';

export default function Page() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const heartbeat = useHeartbeat();

  const heartbeatTone = useMemo(() => {
    switch (heartbeat.status) {
      case 'online':
        return { label: 'Live', color: '#22c55e' };
      case 'degraded':
        return { label: 'Heartbeat delayed', color: '#f97316' };
      case 'offline':
        return { label: 'Offline', color: '#ef4444' };
      default:
        return { label: 'Connecting…', color: '#facc15' };
    }
  }, [heartbeat.status]);

  const latencyLabel = heartbeat.latencyMs != null ? `${Math.max(0, Math.round(heartbeat.latencyMs))}ms` : '—';
  const lastBeatSeconds =
    heartbeat.timeSinceHeartbeat != null ? Math.floor(heartbeat.timeSinceHeartbeat / 1000) : null;

  useEffect(() => {
    const storedNickname = window.localStorage.getItem(NICKNAME_STORAGE_KEY);
    if (storedNickname) {
      setNickname(storedNickname);
    }
  }, []);

  const persistNickname = useCallback((value: string) => {
    const safeValue = value.trim() || 'Guest';
    setNickname(safeValue);
    window.localStorage.setItem(NICKNAME_STORAGE_KEY, safeValue);
  }, []);

  const handleEnterLobby = useCallback(() => {
    persistNickname(nickname);
    router.push('/lobby');
  }, [nickname, persistNickname, router]);

  const handleGenerateNickname = useCallback(() => {
    const generated = generateRandomChineseName();
    persistNickname(generated);
  }, [persistNickname]);

  return (
    <>
      <main
        style={{
          minHeight: '100dvh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 clamp(1.5rem, 4vw, 3rem)',
          background:
            'radial-gradient(circle at 20% 20%, rgba(248, 113, 113, 0.18), transparent 55%), radial-gradient(circle at 80% 15%, rgba(56, 189, 248, 0.18), transparent 45%), #020617',
          color: '#e2e8f0',
          boxSizing: 'border-box',
        }}
      >
        <section
          style={{
            width: '100%',
            maxWidth: 720,
            display: 'grid',
            gap: '1.5rem',
            justifyItems: 'center',
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.78)',
            border: '1px solid rgba(148, 163, 184, 0.32)',
            borderRadius: 30,
            padding: 'clamp(1rem, 2.5vh, 1.75rem) clamp(1.75rem, 4vw, 3rem)',
            boxShadow: '0 32px 80px rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <div
            style={{
              width: 'min(320px, 100%)',
              display: 'grid',
              placeItems: 'center',
              padding: '1.25rem',
              borderRadius: 26,
              border: '1px solid rgba(148, 163, 184, 0.35)',
              background:
                'linear-gradient(145deg, rgba(248, 113, 113, 0.12), rgba(59, 130, 246, 0.12))',
            }}
          >
            <Image
              src="/抱大腿.png"
              alt="抱大腿 logo"
              width={280}
              height={200}
              priority
              style={{ width: '100%', height: 'auto' }}
            />
          </div>

          <div
            style={{
              width: 'min(460px, 100%)',
              display: 'grid',
              gap: '1.25rem',
            }}
          >
            <div style={{ width: '100%', display: 'grid', gap: '0.85rem' }}>
              {/* Playwright relies on data-testid="nickname-input" to preload lobby nicknames. */}
              <input
                data-testid="nickname-input"
                placeholder="输入昵称加入牌局"
                value={nickname}
                onChange={event => setNickname(event.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.9rem 1rem',
                  borderRadius: 12,
                  border: '1px solid rgba(148, 163, 184, 0.45)',
                  background: 'rgba(15, 23, 42, 0.65)',
                  color: '#e2e8f0',
                  fontSize: '1rem',
                  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.35)',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  gap: '0.85rem',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {/* data-testid=enter-lobby-btn is asserted in e2e specs before navigating to /lobby. */}
                <button
                  data-testid="enter-lobby-btn"
                  onClick={handleEnterLobby}
                  style={{
                    flex: 1,
                    boxSizing: 'border-box',
                    minWidth: 170,
                    padding: '0.95rem 1.15rem',
                    borderRadius: 999,
                    border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 18px 40px rgba(249, 115, 22, 0.35)',
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  }}
                >
                  进入大厅
                </button>

                {/* data-testid=random-nickname-btn allows tests to opt into curated name generation. */}
                <button
                  type="button"
                  data-testid="random-nickname-btn"
                  onClick={handleGenerateNickname}
                  style={{
                    flex: 1,
                    boxSizing: 'border-box',
                    minWidth: 170,
                    padding: '0.95rem 1.15rem',
                    borderRadius: 999,
                    border: '1px solid rgba(148, 163, 184, 0.5)',
                    background: 'rgba(15, 23, 42, 0.4)',
                    color: '#e2e8f0',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.35)',
                    transition: 'transform 0.18s ease, border-color 0.18s ease',
                  }}
                >
                  随机昵称
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div
        style={{
          position: 'fixed',
          right: 'clamp(1rem, 3vw, 2rem)',
          bottom: 'clamp(1rem, 3vw, 2rem)',
          display: 'grid',
          gap: 6,
          alignItems: 'flex-start',
          background: 'rgba(15, 23, 42, 0.85)',
          borderRadius: 12,
          padding: '0.85rem 1rem',
          border: '1px solid rgba(148, 163, 184, 0.35)',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.35)',
          color: '#e2e8f0',
          minWidth: 180,
          fontSize: '0.85rem',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: heartbeatTone.color,
              boxShadow: `0 0 12px ${heartbeatTone.color}`,
              transition: 'background 0.2s ease, box-shadow 0.2s ease',
            }}
          />
          {heartbeatTone.label}
        </span>
        <span style={{ opacity: 0.82 }}>Latency: {latencyLabel}</span>
        {heartbeat.connections != null ? (
          <span style={{ opacity: 0.7 }}>Connections: {heartbeat.connections}</span>
        ) : (
          <span style={{ opacity: 0.7 }}>Connections: —</span>
        )}
        <span style={{ opacity: 0.6 }}>
          {lastBeatSeconds != null ? `Last beat ${lastBeatSeconds}s ago` : 'Awaiting heartbeat…'}
        </span>
      </div>
    </>
  );
}
