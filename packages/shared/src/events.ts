import type { Socket as ClientSocket } from 'socket.io-client';
import type { Server, Socket } from 'socket.io';
import { z } from 'zod';

import {
  GameDealCardEvent,
  GameSnapshot,
  Heartbeat,
  GameBidRequest,
  GameDoubleRequest,
  GamePlayRequest,
  JoinTable,
  ServerState,
  TableConfigUpdateRequest,
  TableKickRequest,
  TablePlayStateResponse,
  TablePreparedRequest,
  TableStartRequest,
  TableId,
  UserId
} from './messages';

type SocketEventSchema<Payload extends z.ZodTypeAny, Ack extends z.ZodTypeAny | undefined = undefined> =
  { payload: Payload; ack?: Ack };

type EventSchema = SocketEventSchema<z.ZodTypeAny, z.ZodTypeAny | undefined>;

const LeaveTablePayload = z.object({
  tableId: TableId.optional(),
  userId: UserId.optional()
});
const LeaveTableAck = z.object({ ok: z.boolean(), message: z.string().optional() });

const GameEndedPayload = z.object({
  tableId: TableId,
  reason: z.enum(['player-left', 'manual-reset']).optional()
});

const ErrorMessagePayload = z.object({
  message: z.string().optional()
});

const KickedPayload = z.object({
  tableId: TableId.optional()
});

const clientToServerEvents = {
  'heartbeat:request': { payload: z.undefined() },
  joinTable: { payload: JoinTable },
  'table:start': { payload: TableStartRequest },
  'table:kick': { payload: TableKickRequest },
  'table:updateConfig': { payload: TableConfigUpdateRequest },
  'table:setPrepared': { payload: TablePreparedRequest },
  'game:leave': { payload: LeaveTablePayload, ack: LeaveTableAck },
  'game:bid': { payload: GameBidRequest, ack: LeaveTableAck },
  'game:double': { payload: GameDoubleRequest, ack: LeaveTableAck },
  'game:play': { payload: GamePlayRequest, ack: LeaveTableAck }
} satisfies Record<string, EventSchema>;

const serverToClientEvents = {
  heartbeat: { payload: Heartbeat },
  state: { payload: ServerState },
  'game:deal': { payload: GameDealCardEvent },
  'game:snapshot': { payload: GameSnapshot },
  'game:hydrate': { payload: TablePlayStateResponse },
  'game:ended': { payload: GameEndedPayload },
  errorMessage: { payload: ErrorMessagePayload },
  kicked: { payload: KickedPayload }
} satisfies Record<string, EventSchema>;

export const socketEvents = {
  clientToServer: clientToServerEvents,
  serverToClient: serverToClientEvents
} as const;

type PayloadOf<T extends EventSchema> = z.infer<T['payload']>;
type AckOf<T extends EventSchema> = T['ack'] extends z.ZodTypeAny
  ? z.infer<NonNullable<T['ack']>>
  : never;

type EventHandler<T extends EventSchema> = T['ack'] extends z.ZodTypeAny
  ? (payload: PayloadOf<T>, ack?: (response: AckOf<T>) => void) => void
  : PayloadOf<T> extends undefined
    ? () => void
    : (payload: PayloadOf<T>) => void;

type EmitArgs<T extends EventSchema> = T['ack'] extends z.ZodTypeAny
  ? PayloadOf<T> extends undefined
    ? [payload?: PayloadOf<T>, ack?: (response: AckOf<T>) => void]
    : [payload: PayloadOf<T>, ack?: (response: AckOf<T>) => void]
  : PayloadOf<T> extends undefined
    ? []
    : [payload: PayloadOf<T>];

type PayloadMap<M extends Record<string, EventSchema>> = {
  [K in keyof M]: PayloadOf<M[K]>;
};

type HandlerMap<M extends Record<string, EventSchema>> = {
  [K in keyof M]: EventHandler<M[K]>;
};

type EmitArgsMap<M extends Record<string, EventSchema>> = {
  [K in keyof M]: EmitArgs<M[K]>;
};

export type ClientToServerEvents = HandlerMap<typeof clientToServerEvents>;
export type ServerToClientEvents = HandlerMap<typeof serverToClientEvents>;

export type ClientToServerPayloads = PayloadMap<typeof clientToServerEvents>;
export type ServerToClientPayloads = PayloadMap<typeof serverToClientEvents>;

export type ClientToServerEmitArgs = EmitArgsMap<typeof clientToServerEvents>;
export type ServerToClientEmitArgs = EmitArgsMap<typeof serverToClientEvents>;

export type SocketEventMap = typeof socketEvents;

export type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type AppServerSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
export type AppClientSocket = ClientSocket;
