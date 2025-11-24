import { useEffect, useState } from 'react';

import { ensureUser, loadStoredUser, persistStoredUser, NICKNAME_STORAGE_KEY, type StoredUser } from '../lib/auth';
import { generateRandomChineseName } from '../lib/nickname';

export type AsyncState = 'idle' | 'loading' | 'ready' | 'error';

type UsePlaySessionAuthOptions = {
  apiBaseUrl: string;
  persistNickname: (nickname: string) => void;
  tableId: string;
};

export function usePlaySessionAuth({ apiBaseUrl, persistNickname, tableId }: UsePlaySessionAuthOptions) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AsyncState>('idle');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setUser(null);
    setAuthStatus('idle');
    setAuthError(null);
  }, [tableId]);

  useEffect(() => {
    if (!tableId) {
      return;
    }
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
        console.error('[web] failed to ensure user before play page', error);
        setAuthStatus('error');
        setAuthError('无法验证用户，请返回大厅重试。');
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, persistNickname, tableId]);

  return { user, authStatus, authError };
}
