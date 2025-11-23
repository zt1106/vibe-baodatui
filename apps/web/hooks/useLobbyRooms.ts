'use client';

import { useCallback, useEffect, useState } from 'react';

import { LobbyRoomsResponse, type LobbyNotification, type LobbyRoom } from '@shared/messages';

import { fetchJson } from '../lib/api';
import type { AsyncStatus } from '../lib/types';
import { useApiBaseUrl } from './useApiBaseUrl';

type LobbyRoomsState = AsyncStatus;

export function useLobbyRooms(enabled: boolean) {
  const apiBaseUrl = useApiBaseUrl();

  const [rooms, setRooms] = useState<LobbyRoom[]>([]);
  const [notifications, setNotifications] = useState<LobbyNotification[]>([]);
  const [status, setStatus] = useState<LobbyRoomsState>('idle');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadRooms = async () => {
      setStatus('loading');
      try {
        const payload = await fetchJson<unknown>(`${apiBaseUrl}/lobby/rooms`, {
          signal: controller.signal,
          credentials: 'include'
        });
        const parsed = LobbyRoomsResponse.safeParse(payload);
        if (!parsed.success) {
          throw new Error('Invalid lobby response');
        }
        if (cancelled) {
          return;
        }
        setRooms(parsed.data.rooms);
        setNotifications(parsed.data.notifications);
        setStatus('ready');
      } catch (error) {
        if (controller.signal.aborted || cancelled) {
          return;
        }
        console.error('[web] failed to load lobby rooms', error);
        setRooms([]);
        setNotifications([]);
        setStatus('error');
      }
    };

    loadRooms();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [apiBaseUrl, enabled, reloadToken]);

  const refreshRooms = useCallback(() => {
    setReloadToken(token => token + 1);
  }, []);

  return { rooms, notifications, status, refreshRooms };
}
