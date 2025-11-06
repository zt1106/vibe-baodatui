'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { generateRandomChineseName } from '../lib/nickname';

const NICKNAME_STORAGE_KEY = 'nickname';

export default function Page() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');

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
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '4rem 1.5rem',
        background:
          'radial-gradient(circle at top, rgba(209, 213, 219, 0.2), transparent), #0f172a',
        color: '#e2e8f0',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 480,
          display: 'grid',
          gap: '1.5rem',
          justifyItems: 'center',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          borderRadius: 24,
          padding: '3rem 2rem',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Image src="/poker-logo.svg" alt="Stacked poker chip logo" width={128} height={128} priority />

        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Vibe Poker</h1>
          <p style={{ color: '#cbd5f5', fontSize: '1rem' }}>
            Grab a seat, bring a friend, and test the multiplayer table prototype.
          </p>
        </div>

        <div style={{ width: '100%', display: 'grid', gap: '0.75rem' }}>
          {/* Playwright relies on data-testid="nickname-input" to preload lobby nicknames. */}
          <input
            data-testid="nickname-input"
            placeholder="Nickname"
            value={nickname}
            onChange={event => setNickname(event.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              borderRadius: 12,
              border: '1px solid rgba(148, 163, 184, 0.4)',
              background: 'rgba(15, 23, 42, 0.5)',
              color: '#e2e8f0',
              fontSize: '1rem',
            }}
          />

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* data-testid=enter-lobby-btn is asserted in e2e specs before navigating to /lobby. */}
            <button
              data-testid="enter-lobby-btn"
              onClick={handleEnterLobby}
              style={{
                flex: 1,
                minWidth: 160,
                padding: '0.9rem 1rem',
                borderRadius: 999,
                border: 'none',
                background: '#f97316',
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              Enter Lobby
            </button>

            {/* data-testid=random-nickname-btn allows tests to opt into curated name generation. */}
            <button
              type="button"
              data-testid="random-nickname-btn"
              onClick={handleGenerateNickname}
              style={{
                flex: 1,
                minWidth: 160,
                padding: '0.9rem 1rem',
                borderRadius: 999,
                border: '1px solid rgba(148, 163, 184, 0.4)',
                background: 'transparent',
                color: '#e2e8f0',
                fontWeight: 500,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
            >
              Surprise Me
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
