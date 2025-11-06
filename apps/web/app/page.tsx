
'use client';
import { io, Socket } from 'socket.io-client';
import { useEffect, useMemo, useState } from 'react';

type Seat = { id: string; nickname: string; chips: number };
type Snapshot = { tableId: string; seats: Seat[]; pot: number };

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';

export default function Page() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [nick, setNick] = useState('');
  const [bet, setBet] = useState('10');
  const [state, setState] = useState<Snapshot | null>(null);

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket'] });
    setSocket(s);
    s.on('state', (snap: Snapshot) => setState(snap));
    s.on('connect', () => console.log('[web] connected'));
    return () => { s.disconnect(); };
  }, []);

  return (
    <main>
      <h1>Multiplayer Poker (Prototype)</h1>

      <section style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        <input
          data-testid="nickname-input"
          placeholder="Nickname"
          value={nick}
          onChange={e => setNick(e.target.value)}
          style={{ padding: 8, border: '1px solid #ccc', borderRadius: 8 }}
        />
        <button
          data-testid="join-btn"
          onClick={() => socket?.emit('joinTable', { tableId: 'default', nickname: nick || 'Guest' })}
          style={{ padding: 10, borderRadius: 8 }}
        >
          Join Table
        </button>

        <div>
          <input
            data-testid="bet-input"
            value={bet}
            onChange={e => setBet(e.target.value)}
            style={{ padding: 8, border: '1px solid #ccc', borderRadius: 8, width: 120 }}
          />
          <button
            data-testid="bet-btn"
            onClick={() => socket?.emit('bet', { tableId: 'default', chips: Number(bet) })}
            style={{ marginLeft: 8, padding: 10, borderRadius: 8 }}
          >
            Bet
          </button>
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2>Table</h2>
        <div data-testid="seats" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {state?.seats.map(s => (
            <div key={s.id} style={{ border: '1px solid #ddd', padding: 8, borderRadius: 8 }}>
              <div><b>{s.nickname}</b></div>
              <div>Chips: {s.chips}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          Pot: <span data-testid="pot">${state?.pot ?? 0}</span>
        </div>
      </section>
    </main>
  );
}
