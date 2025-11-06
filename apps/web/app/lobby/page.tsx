'use client';

import { useCallback, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type Seat = { id: string; nickname: string; chips: number };
type Snapshot = { tableId: string; seats: Seat[]; pot: number };

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';
const NICKNAME_STORAGE_KEY = 'nickname';

export default function LobbyPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [nick, setNick] = useState('');
  const [bet, setBet] = useState('10');
  const [state, setState] = useState<Snapshot | null>(null);

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket'] });
    setSocket(s);
    s.on('state', (snapshot: Snapshot) => setState(snapshot));
    s.on('connect', () => console.log('[web] connected'));
    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    const storedNickname = window.localStorage.getItem(NICKNAME_STORAGE_KEY);
    if (storedNickname) {
      setNick(storedNickname);
    }
  }, []);

  const handleJoinTable = useCallback(() => {
    const nickname = nick.trim() || 'Guest';
    setNick(nickname);
    window.localStorage.setItem(NICKNAME_STORAGE_KEY, nickname);
    socket?.emit('joinTable', { tableId: 'default', nickname });
  }, [nick, socket]);

  const handleBet = useCallback(() => {
    socket?.emit('bet', { tableId: 'default', chips: Number(bet) });
  }, [bet, socket]);

  return (
    <main style={{ padding: '2rem', display: 'grid', gap: '1.5rem' }}>
      <header>
        <h1>Multiplayer Lobby</h1>
        <p style={{ color: '#4b5563' }}>
          Invite friends and share the default table while we iterate on matchmaking.
        </p>
      </header>

      <section style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
        {/* Playwright fills data-testid="nickname-input" before asserting table joins. */}
        <input
          data-testid="nickname-input"
          placeholder="Nickname"
          value={nick}
          onChange={event => setNick(event.target.value)}
          style={{ padding: 8, border: '1px solid #ccc', borderRadius: 8 }}
        />
        {/* data-testid=join-btn remains stable for multiplayer join coverage. */}
        <button data-testid="join-btn" onClick={handleJoinTable} style={{ padding: 10, borderRadius: 8 }}>
          Join Table
        </button>

        <div>
          <input
            data-testid="bet-input"
            value={bet}
            onChange={event => setBet(event.target.value)}
            style={{ padding: 8, border: '1px solid #ccc', borderRadius: 8, width: 120 }}
          />
          <button
            data-testid="bet-btn"
            onClick={handleBet}
            style={{ marginLeft: 8, padding: 10, borderRadius: 8 }}
          >
            Bet
          </button>
        </div>
      </section>

      <section>
        <h2>Table</h2>
        <div data-testid="seats" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {state?.seats.map(seat => (
            <div key={seat.id} style={{ border: '1px solid #ddd', padding: 8, borderRadius: 8 }}>
              <div>
                <b>{seat.nickname}</b>
              </div>
              <div>Chips: {seat.chips}</div>
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
