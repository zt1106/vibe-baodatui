'use client';

import { useCallback, useEffect, useState } from 'react';

import { NICKNAME_STORAGE_KEY } from '../lib/auth';
import { generateRandomChineseName } from '../lib/nickname';

export function useStoredNickname() {
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(NICKNAME_STORAGE_KEY);
    if (stored) {
      setNickname(stored);
      return;
    }
    const generated = generateRandomChineseName();
    setNickname(generated);
    window.localStorage.setItem(NICKNAME_STORAGE_KEY, generated);
  }, []);

  const persistNickname = useCallback((value: string) => {
    const sanitized = value.trim() || generateRandomChineseName();
    setNickname(sanitized);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(NICKNAME_STORAGE_KEY, sanitized);
    }
    return sanitized;
  }, []);

  return { nickname, persistNickname };
}
