import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHeartbeatPublisher, type HeartbeatServer, type HeartbeatSocket } from '../infrastructure/heartbeat';

describe('createHeartbeatPublisher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('publishes immediately and on interval, and stops after cleanup', () => {
    const emit = vi.fn<HeartbeatServer['emit']>();
    const io: HeartbeatServer = { emit, engine: { clientsCount: 2 } };
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
    const handlers: Partial<Record<'heartbeat:request', () => void>> = {};
    const socket = {
      emit: vi.fn<HeartbeatSocket['emit']>(),
      on: vi.fn<HeartbeatSocket['on']>((event, cb) => {
        handlers[event] = cb;
        return undefined;
      })
    } satisfies HeartbeatSocket;
    const io: HeartbeatServer = { emit: vi.fn<HeartbeatServer['emit']>(), engine: { clientsCount: 1 } };
    const publisher = createHeartbeatPublisher(io);

    publisher.handleConnection(socket);
    expect(socket.emit).toHaveBeenCalledWith('heartbeat', expect.objectContaining({ status: 'ok' }));

    handlers['heartbeat:request']?.();
    expect(socket.emit).toHaveBeenCalledTimes(2);
  });

  it('exposes snapshot with uptime and connection count', () => {
    const io: HeartbeatServer = { emit: vi.fn(), engine: { clientsCount: 7 } };
    const publisher = createHeartbeatPublisher(io);
    const snap = publisher.snapshot();
    expect(snap.status).toBe('ok');
    expect(snap.connections).toBe(7);
    expect(snap.uptimeMs).toBeGreaterThanOrEqual(0);
  });
});
