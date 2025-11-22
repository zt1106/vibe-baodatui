import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHeartbeatPublisher } from '../infrastructure/heartbeat';

describe('createHeartbeatPublisher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('publishes immediately and on interval, and stops after cleanup', () => {
    const emit = vi.fn();
    const io = { emit, engine: { clientsCount: 2 } } as any;
    const publisher = createHeartbeatPublisher(io);
    const stop = publisher.start();

    expect(emit).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5000);
    expect(emit).toHaveBeenCalledTimes(2);

    stop();
    vi.advanceTimersByTime(5000);
    expect(emit).toHaveBeenCalledTimes(2);
  });

  it('emits heartbeat snapshots to connecting sockets and on request', () => {
    const handlers: Record<string, () => void> = {};
    const socket = {
      emit: vi.fn(),
      on: vi.fn((event: string, cb: () => void) => {
        handlers[event] = cb;
      })
    };
    const io = { emit: vi.fn(), engine: { clientsCount: 1 } } as any;
    const publisher = createHeartbeatPublisher(io);

    publisher.handleConnection(socket as any);
    expect(socket.emit).toHaveBeenCalledWith('heartbeat', expect.objectContaining({ status: 'ok' }));

    handlers['heartbeat:request']?.();
    expect(socket.emit).toHaveBeenCalledTimes(2);
  });

  it('exposes snapshot with uptime and connection count', () => {
    const io = { emit: vi.fn(), engine: { clientsCount: 7 } } as any;
    const publisher = createHeartbeatPublisher(io);
    const snap = publisher.snapshot();
    expect(snap.status).toBe('ok');
    expect(snap.connections).toBe(7);
    expect(snap.uptimeMs).toBeGreaterThanOrEqual(0);
  });
});
