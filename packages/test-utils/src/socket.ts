import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server, type ServerOptions, type Socket as ServerSocket } from 'socket.io';
import Client, {
  type ManagerOptions,
  type Socket as ClientSocket,
  type SocketOptions
} from 'socket.io-client';

export type SocketTestServer = {
  app: http.Server;
  io: Server;
  url: string;
  close: () => Promise<void>;
};

export async function createSocketServer(
  options: Partial<ServerOptions> = {}
): Promise<SocketTestServer> {
  const app = http.createServer();
  const io = new Server(app, { cors: { origin: '*' }, ...options });
  await new Promise<void>(resolve => app.listen(0, resolve));
  const address = app.address() as AddressInfo | null;
  const port = typeof address === 'string' ? 80 : address?.port ?? 80;
  const url = `http://127.0.0.1:${port}`;
  const close = async () => {
    await new Promise<void>(resolve => io.close(() => resolve()));
    await new Promise<void>(resolve => app.close(() => resolve()));
  };
  return { app, io, url, close };
}

export function waitForEvent<T = void>(
  emitter: { once(event: string, cb: (...args: unknown[]) => void): void },
  event: string
): Promise<T> {
  return new Promise(resolve => emitter.once(event, (data: unknown) => resolve(data as T)));
}

export async function createSocketPair(options?: {
  server?: Partial<ServerOptions>;
  client?: Partial<ManagerOptions & SocketOptions>;
}): Promise<SocketPair> {
  const server = await createSocketServer(options?.server);
  const serverSocketPromise = waitForEvent<ServerSocket>(server.io, 'connection');
  const client = Client(server.url, options?.client);
  await waitForEvent(client, 'connect');
  const serverSocket = await serverSocketPromise;
  return { server, client, serverSocket };
}

export type SocketPair = {
  server: SocketTestServer;
  client: ClientSocket;
  serverSocket: ServerSocket;
};
export type TestClientSocket = ClientSocket;
