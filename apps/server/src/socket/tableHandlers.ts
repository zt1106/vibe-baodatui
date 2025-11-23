import type { AppServer, AppServerSocket } from '@shared/events';
import {
  JoinTable,
  TableConfigUpdateRequest,
  TableKickRequest,
  TablePreparedRequest,
  TableStartRequest,
  GameBidRequest,
  GameDoubleRequest,
  GamePlayRequest
} from '@shared/messages';
import { TableManager } from '../domain/tableManager';
import { createHeartbeatPublisher } from '../infrastructure/heartbeat';

type Heartbeat = ReturnType<typeof createHeartbeatPublisher>;

export function registerTableSocketHandlers(
  io: AppServer,
  tableManager: TableManager,
  heartbeat: Heartbeat
) {
  io.on('connection', (socket: AppServerSocket) => {
    heartbeat.handleConnection(socket);
    heartbeat.publish();

    tableManager.broadcastAllStates();

    socket.on('joinTable', (payload) => {
      const parsed = JoinTable.safeParse(payload);
      if (!parsed.success) return;
      tableManager.handleJoin(socket, parsed.data);
    });

    socket.on('table:start', (payload) => {
      const parsed = TableStartRequest.safeParse(payload);
      if (!parsed.success) return;
      tableManager.handleStart(socket, parsed.data);
    });

    socket.on('table:kick', (payload) => {
      const parsed = TableKickRequest.safeParse(payload);
      if (!parsed.success) return;
      tableManager.handleKick(socket, parsed.data);
    });

    socket.on('table:updateConfig', (payload) => {
      const parsed = TableConfigUpdateRequest.safeParse(payload);
      if (!parsed.success) return;
      tableManager.handleUpdateConfig(socket, parsed.data);
    });

    socket.on('table:setPrepared', (payload) => {
      const parsed = TablePreparedRequest.safeParse(payload);
      if (!parsed.success) return;
      tableManager.handleSetPrepared(socket, parsed.data);
    });

    socket.on('game:leave', (payload: { tableId?: string; userId?: number }, ack?: (result: { ok: boolean }) => void) => {
      tableManager.handleLeave(socket, payload, ack);
    });

    socket.on('game:bid', (payload, ack) => {
      const parsed = GameBidRequest.safeParse(payload);
      if (!parsed.success) {
        ack?.({ ok: false, message: 'invalid bid payload' });
        return;
      }
      tableManager.handleBid(socket, parsed.data, ack);
    });

    socket.on('game:double', (payload, ack) => {
      const parsed = GameDoubleRequest.safeParse(payload);
      if (!parsed.success) {
        ack?.({ ok: false, message: 'invalid double payload' });
        return;
      }
      tableManager.handleDouble(socket, parsed.data, ack);
    });

    socket.on('game:play', (payload, ack) => {
      const parsed = GamePlayRequest.safeParse(payload);
      if (!parsed.success) {
        ack?.({ ok: false, message: 'invalid play payload' });
        return;
      }
      tableManager.handlePlay(socket, parsed.data, ack);
    });

    socket.on('disconnect', () => {
      tableManager.handleDisconnect(socket.id);
      heartbeat.publish();
    });
  });
}
