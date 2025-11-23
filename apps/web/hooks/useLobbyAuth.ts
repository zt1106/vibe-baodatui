'use client';

import { useCallback, useEffect, useState } from 'react';

import { ensureUser, loadStoredUser, persistStoredUser, NICKNAME_STORAGE_KEY, type StoredUser } from '../lib/auth';
import { generateRandomChineseName } from '../lib/nickname';
import type { AsyncStatus } from '../lib/types';
import { useApiBaseUrl } from './useApiBaseUrl';
import { useStoredNickname } from './useStoredNickname';

type AuthState = AsyncStatus;

export function useLobbyAuth() {
  const apiBaseUrl = useApiBaseUrl();
  const { persistNickname } = useStoredNickname();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthState>('idle');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      setAuthStatus('loading');
      setAuthError(null);
      try {
        const storedUser = loadStoredUser();
        const storedNickname =
          storedUser?.nickname ??
          (typeof window !== 'undefined' ? window.localStorage.getItem(NICKNAME_STORAGE_KEY) : null) ??
          generateRandomChineseName();
        const authenticated = await ensureUser(apiBaseUrl, storedNickname);
        if (cancelled) return;
        persistStoredUser(authenticated);
        persistNickname(authenticated.nickname);
        setUser(authenticated);
        setAuthStatus('ready');
      } catch (error) {
        if (cancelled) return;
        console.error('[web] failed to ensure user on lobby load', error);
        setAuthError('无法登录，请返回首页重试。');
        setAuthStatus('error');
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, persistNickname]);

  const updateUser = useCallback(
    (next: StoredUser) => {
      persistStoredUser(next);
      persistNickname(next.nickname);
      setUser(next);
    },
    [persistNickname]
  );

  return { apiBaseUrl, user, authStatus, authError, updateUser };
}
