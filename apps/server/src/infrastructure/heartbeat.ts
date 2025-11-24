import type { AppServer } from '@shared/events';
import type { Heartbeat } from '@shared/messages';

const HEARTBEAT_INTERVAL_MS = 5_000;

type Cleanup = () => void;

export type HeartbeatServer = {
  emit: (event: 'heartbeat', payload: Heartbeat) => unknown;
  engine: Pick<AppServer['engine'], 'clientsCount'>;
};

export type HeartbeatSocket = {
  emit: (event: 'heartbeat', payload: Heartbeat) => unknown;
  on: (event: 'heartbeat:request', listener: () => void) => unknown;
};

/**
 * Periodically publishes a heartbeat payload to connected Socket.IO clients.
 * Also primes newly connected sockets with an immediate heartbeat so the UI
 * can reflect connection state without waiting for the next interval.
 */
export function createHeartbeatPublisher(io: HeartbeatServer): {
  start: () => Cleanup;
  handleConnection: (socket: HeartbeatSocket) => void;
  publish: () => void;
  snapshot: () => Heartbeat;
} {
  const bootAt = Date.now();

  const snapshot = (): Heartbeat => ({
    status: 'ok',
    timestamp: Date.now(),
    uptimeMs: Date.now() - bootAt,
    connections: io.engine.clientsCount
  });

  const publish = () => {
    io.emit('heartbeat', snapshot());
  };

  function handleConnection(socket: HeartbeatSocket) {
    socket.emit('heartbeat', snapshot());
    socket.on('heartbeat:request', () => socket.emit('heartbeat', snapshot()));
  }

  function start(): Cleanup {
    publish();
    const interval = setInterval(publish, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }

  return { start, handleConnection, publish, snapshot };
}
