import type express from 'express';
import type { createLobbyRegistry } from '../../infrastructure/lobbyRegistry';
import { logError } from '../../logger';

type Lobby = ReturnType<typeof createLobbyRegistry>;

export function registerLobbyRoutes(app: express.Express, lobby: Lobby) {
  app.get('/lobby/rooms', (_req, res) => {
    try {
      res.json(lobby.snapshot());
    } catch (error) {
      logError('route:lobby.rooms', error);
      res.status(500).json({ error: 'Failed to load lobby rooms' });
    }
  });
}
