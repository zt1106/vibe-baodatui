import type express from 'express';
import {
  CreateTableRequest,
  TablePlayStateResponse,
  TablePrepareResponse
} from '@shared/messages';
import type { createUserRegistry } from '../../infrastructure/userRegistry';
import type { TableManager } from '../../domain/tableManager';
import { normalizeTableId } from '../../domain/tableManager';
import { logError } from '../../logger';

type Users = ReturnType<typeof createUserRegistry>;

const normalizeNickname = (value: string) => value.trim().toLowerCase();

export function registerTableRoutes(
  app: express.Express,
  deps: { tableManager: TableManager; users: Users }
) {
  const { tableManager, users } = deps;

  app.get('/tables/:tableId/prepare', (req, res) => {
    const requestedId = normalizeTableId(req.params.tableId ?? '');
    const payload = tableManager.getPrepareState(requestedId);
    if (!payload) {
      res.status(404).json({ error: 'Unknown table' });
      return;
    }
    try {
      res.json(TablePrepareResponse.parse(payload));
    } catch (error) {
      logError('route:tables.prepare', error, { tableId: requestedId });
      res.status(500).json({ error: 'Failed to load table' });
    }
  });

  app.get('/tables/:tableId/play', (req, res) => {
    const requestedId = normalizeTableId(req.params.tableId ?? '');
    if (!requestedId) {
      res.status(400).json({ error: 'Invalid table id' });
      return;
    }
    const userId = Number(req.query.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }
    const payload = tableManager.getPlayState(requestedId, userId);
    if (!payload) {
      res.status(404).json({ error: 'Player not found at this table' });
      return;
    }
    try {
      res.json(TablePlayStateResponse.parse(payload));
    } catch (error) {
      logError('route:tables.play', error, { tableId: requestedId, userId });
      res.status(500).json({ error: 'Failed to load play state' });
    }
  });

  app.post('/tables', (req, res) => {
    const parsed = CreateTableRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid create table payload' });
      return;
    }
    const hostRecord = users.findById(parsed.data.host.userId);
    if (
      !hostRecord ||
      normalizeNickname(hostRecord.nickname) !== normalizeNickname(parsed.data.host.nickname)
    ) {
      res.status(400).json({ error: 'Unknown host user' });
      return;
    }
    try {
      const table = tableManager.createTable(hostRecord, parsed.data.variantId);
      res.status(201).json(table);
    } catch (error) {
      logError('route:tables.create', error, {
        hostId: parsed.data.host.userId,
        variantId: parsed.data.variantId
      });
      res.status(500).json({ error: 'Failed to create table' });
    }
  });
}
