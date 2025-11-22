import type express from 'express';
import { createHeartbeatPublisher } from '../../infrastructure/heartbeat';

type Heartbeat = ReturnType<typeof createHeartbeatPublisher>;

export function registerSystemRoutes(app: express.Express, heartbeat: Heartbeat) {
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.get('/ready', (_req, res) => {
    const snapshot = heartbeat.snapshot();
    res.json({ ok: snapshot.status === 'ok', uptimeMs: snapshot.uptimeMs, connections: snapshot.connections });
  });
}
