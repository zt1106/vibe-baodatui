import { type Server, type Socket } from 'socket.io';
import {
  JoinTable,
  TableConfigUpdateRequest,
  TableKickRequest,
  TablePreparedRequest,
  TableStartRequest
} from '@shared/messages';
import { TableManager } from '../domain/tableManager';
import { createHeartbeatPublisher } from '../infrastructure/heartbeat';

type Heartbeat = ReturnType<typeof createHeartbeatPublisher>;

export function registerTableSocketHandlers(
  io: Server,
  tableManager: TableManager,
  heartbeat: Heartbeat
) {
  io.on('connection', (socket: Socket) => {
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

    socket.on('disconnect', () => {
      tableManager.handleDisconnect(socket.id);
      heartbeat.publish();
    });
  });
}
