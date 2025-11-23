'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import type { Heartbeat } from '@shared/messages';
import type { AppClientSocket } from '@shared/events';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';
const STALE_THRESHOLD_MS = 12_000;
const POLL_INTERVAL_MS = 1_000;

type Phase = 'connecting' | 'connected' | 'disconnected';

type InternalState = {
  phase: Phase;
  lastHeartbeatAt: number | null;
  latencyMs: number | null;
  connections: number | null;
};

export type HeartbeatStatus = 'online' | 'connecting' | 'offline' | 'degraded';

export function useHeartbeat() {
  const socketRef = useRef<AppClientSocket | null>(null);
  const [tick, setTick] = useState(() => Date.now());
  const [state, setState] = useState<InternalState>({
    phase: 'connecting',
    lastHeartbeatAt: null,
    latencyMs: null,
    connections: null
  });

  useEffect(() => {
    let active = true;
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelayMax: 2_000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (!active) return;
      setState(prev => ({
        ...prev,
        phase: 'connected'
      }));
      socket.emit('heartbeat:request');
    });

    socket.on('reconnect_attempt', () => {
      if (!active) return;
      setState(prev => ({
        ...prev,
        phase: 'connecting'
      }));
    });

    socket.on('disconnect', () => {
      if (!active) return;
      setState({
        phase: 'disconnected',
        lastHeartbeatAt: null,
        latencyMs: null,
        connections: null
      });
    });

    socket.on('connect_error', () => {
      if (!active) return;
      setState({
        phase: 'disconnected',
        lastHeartbeatAt: null,
        latencyMs: null,
        connections: null
      });
    });

    socket.on('heartbeat', (payload: Heartbeat) => {
      if (!active) return;
      const now = Date.now();
      const latencyMs = Math.max(0, now - payload.timestamp);
      setState(prev => ({
        ...prev,
        phase: 'connected',
        lastHeartbeatAt: now,
        latencyMs,
        connections: payload.connections
      }));
    });

    return () => {
      active = false;
      socketRef.current = null;
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const timeSinceHeartbeat = useMemo(() => {
    if (!state.lastHeartbeatAt) {
      return null;
    }
    return Math.max(0, tick - state.lastHeartbeatAt);
  }, [tick, state.lastHeartbeatAt]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || timeSinceHeartbeat === null) return;
    if (state.phase === 'connected' && timeSinceHeartbeat > STALE_THRESHOLD_MS) {
      socket.emit('heartbeat:request');
    }
  }, [state.phase, timeSinceHeartbeat]);

  const status: HeartbeatStatus = useMemo(() => {
    if (state.phase === 'disconnected') return 'offline';
    if (state.phase === 'connecting') return 'connecting';
    if (timeSinceHeartbeat === null) return 'connecting';
    return timeSinceHeartbeat > STALE_THRESHOLD_MS ? 'degraded' : 'online';
  }, [state.phase, timeSinceHeartbeat]);

  return {
    status,
    latencyMs: state.latencyMs,
    connections: state.connections,
    lastHeartbeatAt: state.lastHeartbeatAt,
    timeSinceHeartbeat
  };
}
