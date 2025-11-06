'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ensureUser, loadStoredUser, persistStoredUser, clearStoredUser, type StoredUser } from '../../lib/auth';

const NICKNAME_STORAGE_KEY = 'nickname';

export default function LobbyPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const apiBaseUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';
    return base.replace(/\/$/, '');
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setStatus('loading');
      setError(null);
      try {
        const storedUser = loadStoredUser();
        const storedNickname =
          storedUser?.nickname ??
          (typeof window !== 'undefined' ? window.localStorage.getItem(NICKNAME_STORAGE_KEY) : null) ??
          'Guest';
        const authenticated = await ensureUser(apiBaseUrl, storedNickname);
        persistStoredUser(authenticated);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(NICKNAME_STORAGE_KEY, authenticated.nickname);
        }
        setUser(authenticated);
        setStatus('ready');
      } catch (err) {
        console.error('[web] failed to ensure user on lobby load', err);
        setError('无法登录，请返回首页重试。');
        setStatus('error');
      }
    };

    bootstrap();
  }, [apiBaseUrl]);

  const handleBackHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleLogout = useCallback(() => {
    clearStoredUser();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(NICKNAME_STORAGE_KEY);
    }
    setUser(null);
    setStatus('error');
    setError('已登出，请返回首页重新登录。');
  }, []);

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: '#0f172a',
        color: '#e2e8f0',
        padding: '2rem',
      }}
    >
      <section
        style={{
          width: 'min(520px, 100%)',
          display: 'grid',
          gap: '1.5rem',
          background: 'rgba(15, 23, 42, 0.78)',
          borderRadius: 24,
          padding: '2rem',
          border: '1px solid rgba(148, 163, 184, 0.28)',
          boxShadow: '0 32px 80px rgba(15, 23, 42, 0.55)',
        }}
      >
        <header style={{ display: 'grid', gap: '0.25rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>玩家登录状态</h1>
          <p style={{ margin: 0, opacity: 0.7 }}>进入大厅前会自动注册或登录，无需手动操作。</p>
        </header>

        <div
          data-testid="lobby-login-status"
          style={{
            padding: '1.25rem',
            borderRadius: 18,
            border: '1px solid rgba(148, 163, 184, 0.35)',
            background: user ? 'rgba(22, 163, 74, 0.12)' : 'rgba(248, 113, 113, 0.12)',
            color: user ? '#4ade80' : '#fca5a5',
            minHeight: '4.5rem',
            display: 'grid',
            gap: '0.35rem',
          }}
        >
          {status === 'loading' ? (
            <span>正在登录…</span>
          ) : user ? (
            <>
              <span>已登录：{user.nickname}</span>
              <span style={{ fontSize: '0.95rem', opacity: 0.8 }}>用户编号：{user.id}</span>
            </>
          ) : (
            <span>{error ?? '尚未登录。'}</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleBackHome}
            style={{
              flex: 1,
              minWidth: 160,
              padding: '0.85rem 1rem',
              borderRadius: 999,
              background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
              color: '#0f172a',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 18px 40px rgba(99, 102, 241, 0.35)',
            }}
          >
            返回首页
          </button>
          <button
            onClick={handleLogout}
            style={{
              flex: 1,
              minWidth: 160,
              padding: '0.85rem 1rem',
              borderRadius: 999,
              border: '1px solid rgba(248, 113, 113, 0.45)',
              background: 'rgba(248, 113, 113, 0.08)',
              color: '#fda4af',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            登出
          </button>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '1rem',
              borderRadius: 14,
              background: 'rgba(248, 113, 113, 0.15)',
              border: '1px solid rgba(248, 113, 113, 0.35)',
              color: '#fecaca',
              fontSize: '0.95rem',
            }}
          >
            {error}
          </div>
        )}
      </section>
    </main>
  );
}
