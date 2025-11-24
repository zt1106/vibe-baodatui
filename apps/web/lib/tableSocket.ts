'use client';

import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { Card } from '@poker/core-cards';
import type { GameDealCardEvent } from '@shared/messages';
import type { AppClientSocket } from '@shared/events';

type HandListener = (cards: Card[]) => void;

let sharedSocket: AppClientSocket | null = null;
let sharedTableId: string | null = null;
let refCount = 0;
let joinedTableId: string | null = null;
let cachedHand: Card[] = [];
const handListeners = new Set<HandListener>();

const SOCKET_OPTIONS = {
  transports: ['websocket'],
  withCredentials: true,
  reconnection: true,
  reconnectionDelayMax: 2_000
};

function cloneHand(cards: Card[]) {
  return cards.map(card => ({ ...card }));
}

function notifyHand() {
  const snapshot = cloneHand(cachedHand);
  handListeners.forEach(listener => listener(snapshot));
}

function attachBaseListeners(socket: AppClientSocket) {
  const existing = (socket as never as { __tableHandlersAttached?: boolean }).__tableHandlersAttached;
  if (existing) {
    return;
  }
  const handleDeal = (payload: GameDealCardEvent) => {
    if (!sharedSocket || socket.id !== sharedSocket.id) return;
    if (!sharedTableId || payload.tableId !== sharedTableId) return;
    if (payload.seatId !== socket.id) return;
    cachedHand = [...cachedHand, payload.card];
    notifyHand();
  };
  const handleDisconnect = () => {
    joinedTableId = null;
    cachedHand = [];
    notifyHand();
  };
  socket.on('game:deal', handleDeal);
  socket.on('disconnect', handleDisconnect);
  Object.assign(socket as never, {
    __tableHandlersAttached: true,
    __tableDealHandler: handleDeal,
    __tableDisconnectHandler: handleDisconnect
  });
}

function detachBaseListeners(socket: AppClientSocket) {
  const handlers = socket as never as {
    __tableHandlersAttached?: boolean;
    __tableDealHandler?: (payload: GameDealCardEvent) => void;
    __tableDisconnectHandler?: () => void;
  };
  if (!handlers.__tableHandlersAttached) {
    return;
  }
  if (handlers.__tableDealHandler) {
    socket.off('game:deal', handlers.__tableDealHandler);
  }
  if (handlers.__tableDisconnectHandler) {
    socket.off('disconnect', handlers.__tableDisconnectHandler);
  }
  delete handlers.__tableHandlersAttached;
  delete handlers.__tableDealHandler;
  delete handlers.__tableDisconnectHandler;
}

export function acquireTableSocket(baseUrl: string, tableId: string) {
  if (sharedSocket && sharedTableId && sharedTableId !== tableId) {
    detachBaseListeners(sharedSocket);
    sharedSocket.disconnect();
    sharedSocket = null;
    joinedTableId = null;
    cachedHand = [];
    notifyHand();
    refCount = 0;
    sharedTableId = null;
  }
  if (!sharedSocket) {
    sharedSocket = io(baseUrl, SOCKET_OPTIONS);
    sharedTableId = tableId;
    attachBaseListeners(sharedSocket);
  }
  refCount += 1;
  return sharedSocket;
}

export function releaseTableSocket(socket: AppClientSocket) {
  if (!sharedSocket || socket.id !== sharedSocket.id) {
    return;
  }
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0) {
    detachBaseListeners(socket);
    socket.disconnect();
    sharedSocket = null;
    sharedTableId = null;
    joinedTableId = null;
    cachedHand = [];
    notifyHand();
  }
}

export function isTableSocketJoined(tableId: string) {
  return Boolean(sharedSocket && joinedTableId === tableId);
}

export function markTableSocketJoined(tableId: string) {
  joinedTableId = tableId;
}

export function clearTableSocketJoin(tableId?: string) {
  if (!tableId || joinedTableId === tableId) {
    joinedTableId = null;
  }
}

export function subscribeToHandUpdates(listener: HandListener) {
  handListeners.add(listener);
  listener(cloneHand(cachedHand));
  return () => {
    handListeners.delete(listener);
  };
}

export function resetSharedHand() {
  cachedHand = [];
  notifyHand();
}

export function hydrateSharedHand(cards: Card[]) {
  cachedHand = cloneHand(cards);
  notifyHand();
}

export function getSharedSocket() {
  return sharedSocket;
}

export type TableSocketLease = {
  socket: AppClientSocket;
  release: () => void;
};

export type TableSocketLifecycleCallbacks = {
  onConnect?: () => void;
  onReconnect?: () => void;
  onConnectError?: (error: Error) => void;
  onServerError?: (payload: { message?: string }) => void;
  onKicked?: (payload: { tableId?: string }) => void;
};

export function createTableSocketLease(baseUrl: string, tableId: string): TableSocketLease {
  const socket = acquireTableSocket(baseUrl, tableId);
  let released = false;
  return {
    socket,
    release: () => {
      if (released) return;
      released = true;
      releaseTableSocket(socket);
      clearTableSocketJoin(tableId);
    }
  };
}

export function attachTableSocketLifecycle(
  socket: Socket,
  tableId: string,
  payload: { userId: number; nickname: string },
  callbacks: TableSocketLifecycleCallbacks = {}
) {
  const joinPayload = { ...payload, tableId };

  const requestJoin = () => {
    console.info('[tableSocket] requestJoin', joinPayload);
    socket.emit('joinTable', joinPayload);
  };

  const handleConnect = () => {
    console.info('[tableSocket] connect', { tableId });
    requestJoin();
    callbacks.onConnect?.();
  };

  const handleReconnect = () => {
    console.info('[tableSocket] reconnect', { tableId });
    clearTableSocketJoin(tableId);
    requestJoin();
    callbacks.onReconnect?.();
  };

  const handleConnectError = (error: Error) => {
    console.warn('[tableSocket] connect_error', { tableId, error: error.message });
    callbacks.onConnectError?.(error);
  };

  const handleServerError = (serverPayload: { message?: string }) => {
    console.warn('[tableSocket] server_error', { tableId, message: serverPayload?.message });
    callbacks.onServerError?.(serverPayload);
  };

  const handleKicked = (serverPayload: { tableId?: string }) => {
    console.warn('[tableSocket] kicked', serverPayload);
    callbacks.onKicked?.(serverPayload);
  };

  socket.on('connect', handleConnect);
  socket.on('reconnect', handleReconnect);
  socket.on('connect_error', handleConnectError);
  socket.on('errorMessage', handleServerError);
  socket.on('kicked', handleKicked);
  requestJoin();

  return () => {
    socket.off('connect', handleConnect);
    socket.off('reconnect', handleReconnect);
    socket.off('connect_error', handleConnectError);
    socket.off('errorMessage', handleServerError);
    socket.off('kicked', handleKicked);
  };
}
