
import { describe, it, expect } from 'vitest';
import { Server } from 'socket.io';
import Client, { type Socket } from 'socket.io-client';
import http from 'http';

function waitFor<T>(emitter: Pick<Socket, 'once'>, event: string): Promise<T> {
  return new Promise(res => emitter.once(event, (data: T) => res(data)));
}

describe('socket.io simple flow', async () => {
  it('broadcasts state on join', async () => {
    const app = http.createServer();
    const io = new Server(app, { cors: { origin: '*' } });
    io.on('connection', (s) => s.emit('state', { ok: true }));
    await new Promise<void>(r => app.listen(0, r));
    const addr = app.address();
    const port = typeof addr === 'string' ? 80 : addr?.port || 80;

    const client = Client(`http://localhost:${port}`);
    const msg = await waitFor<{ ok: boolean }>(client, 'state');
    expect(msg.ok).toBe(true);

    client.close();
    io.close();
    app.close();
  });
});
