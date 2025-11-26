'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

import { useHeartbeat } from '../lib/heartbeat';
import {
  ensureUser,
  loadStoredUser,
  persistStoredUser,
  clearStoredUser,
  type StoredUser
} from '../lib/auth';
import { generateRandomChineseName } from '../lib/nickname';
import styles from './HomePage.module.css';

const NICKNAME_STORAGE_KEY = 'nickname';

export default function Page() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [user, setUser] = useState<StoredUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const heartbeat = useHeartbeat();
  const apiBaseUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';
    return base.replace(/\/$/, '');
  }, []);

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
    const storedUser = loadStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setNickname(storedUser.nickname);
      window.localStorage.setItem(NICKNAME_STORAGE_KEY, storedUser.nickname);
      return;
    }
    const storedNickname = window.localStorage.getItem(NICKNAME_STORAGE_KEY);
    if (storedNickname) setNickname(storedNickname);
  }, []);

  const persistNickname = useCallback((value: string) => {
    const safeValue = value.trim() || generateRandomChineseName();
    setNickname(safeValue);
    window.localStorage.setItem(NICKNAME_STORAGE_KEY, safeValue);
  }, []);

  const handleEnterLobby = useCallback(async () => {
    if (isAuthenticating) return;
    const targetNickname = nickname.trim() || generateRandomChineseName();
    persistNickname(targetNickname);
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      const authenticated = await ensureUser(apiBaseUrl, targetNickname);
      persistStoredUser(authenticated);
      setUser(authenticated);
      setNickname(authenticated.nickname);
      router.push('/lobby');
    } catch (error) {
      console.error('[web] failed to authenticate before lobby navigation', error);
      setAuthError('无法登录，请稍后再试。');
    } finally {
      setIsAuthenticating(false);
    }
  }, [apiBaseUrl, isAuthenticating, nickname, persistNickname, router]);

  const handleLogout = useCallback(() => {
    clearStoredUser();
    setUser(null);
    setNickname('');
    window.localStorage.removeItem(NICKNAME_STORAGE_KEY);
  }, []);

  const handleGenerateNickname = useCallback(() => {
    if (isAuthenticating) return;
    const generated = generateRandomChineseName();
    persistNickname(generated);
  }, [isAuthenticating, persistNickname]);

  return (
    <>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div
            className={styles.logoPanel}
          >
            <Image
              src="/抱大腿.png"
              alt="抱大腿 logo"
              width={280}
              height={200}
              priority
              className={styles.logoImage}
            />
          </div>

          <div
            className={styles.formContainer}
          >
            <div className={styles.formGrid}>
              {/* Playwright relies on data-testid="nickname-input" to preload lobby nicknames. */}
              <input
                data-testid="nickname-input"
                placeholder="输入昵称加入牌局"
                value={user ? `Logged in as ${user.nickname}` : nickname}
                onChange={event => {
                  if (user) return;
                  setNickname(event.target.value);
                }}
                disabled={!!user}
                className={user ? `${styles.input} ${styles.inputLoggedIn}` : styles.input}
              />

              <div
                className={styles.actionRow}
              >
                {/* data-testid=enter-lobby-btn is asserted in e2e specs before navigating to /lobby. */}
                <button
                  data-testid="enter-lobby-btn"
                  onClick={handleEnterLobby}
                  disabled={isAuthenticating}
                  className={styles.primaryButton}
                >
                  {isAuthenticating ? '登录中…' : '进入大厅'}
                </button>

                {user ? (
                  <button
                    type="button"
                    data-testid="logout-btn"
                    onClick={handleLogout}
                    className={styles.ghostButton}
                  >
                    登出
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid="random-nickname-btn"
                    onClick={handleGenerateNickname}
                    disabled={isAuthenticating}
                    className={styles.ghostButton}
                  >
                    随机昵称
                  </button>
                )}
              </div>

              {authError ? (
                <div
                  role="alert"
                  className={styles.errorBanner}
                >
                  {authError}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <div className={styles.statusPanel}>
        <span className={styles.statusHeader}>
          <span
            aria-hidden
            className={styles.statusDot}
            style={{ '--tone-color': heartbeatTone.color } as CSSProperties}
          />
          {heartbeatTone.label}
        </span>
        <span className={styles.statusText}>Latency: {latencyLabel}</span>
        {heartbeat.connections != null ? (
          <span className={styles.statusSubtle}>Connections: {heartbeat.connections}</span>
        ) : (
          <span className={styles.statusSubtle}>Connections: —</span>
        )}
        <span className={styles.statusFaint}>
          {lastBeatSeconds != null ? `Last beat ${lastBeatSeconds}s ago` : 'Awaiting heartbeat…'}
        </span>
      </div>
    </>
  );
}
