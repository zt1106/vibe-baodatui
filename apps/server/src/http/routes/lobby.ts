import type express from 'express';
import { createLobbyRegistry } from '../../infrastructure/lobbyRegistry';

type Lobby = ReturnType<typeof createLobbyRegistry>;

export function registerLobbyRoutes(app: express.Express, lobby: Lobby) {
  app.get('/lobby/rooms', (_req, res) => {
    try {
      res.json(lobby.snapshot());
    } catch (error) {
      console.error('[server] failed to build lobby snapshot', error);
      res.status(500).json({ error: 'Failed to load lobby rooms' });
    }
  });
}
