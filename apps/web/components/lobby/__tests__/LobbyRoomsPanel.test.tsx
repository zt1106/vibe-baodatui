import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import type { LobbyRoom } from '@shared/messages';

import { LobbyRoomsPanel } from '../LobbyRoomsPanel';

const baseVariant: LobbyRoom['variant'] = {
  id: 'dou-dizhu',
  name: '斗地主',
  description: '三人对局，17 张手牌，保留 3 张底牌',
  capacity: { min: 3, max: 3, locked: 3 }
};

const buildRoom = (overrides: Partial<LobbyRoom> = {}): LobbyRoom => ({
  id: overrides.id ?? 'room-1',
  status: overrides.status ?? 'waiting',
  players: overrides.players ?? 1,
  capacity: overrides.capacity ?? 3,
  variant: overrides.variant ?? baseVariant
});

describe('LobbyRoomsPanel', () => {
  test('renders loading and empty states', () => {
    const { rerender } = render(<LobbyRoomsPanel rooms={[]} status="loading" />);
    expect(screen.getByText('正在准备房间列表…')).toBeInTheDocument();

    rerender(<LobbyRoomsPanel rooms={[]} status="ready" />);
    expect(screen.getByText('敬请期待新牌桌开放！')).toBeInTheDocument();
  });

  test('renders room cards and respects availability', () => {
    const rooms: LobbyRoom[] = [
      buildRoom({ id: 'open-1', status: 'waiting', players: 1 }),
      buildRoom({ id: 'full-1', status: 'full', players: 3 })
    ];
    const enterRoom = vi.fn();

    render(<LobbyRoomsPanel rooms={rooms} status="ready" onEnterRoom={enterRoom} />);

    const openCard = screen.getByRole('heading', { name: /房间 open-1/i }).closest('article');
    const fullCard = screen.getByRole('heading', { name: /房间 full-1/i }).closest('article');
    expect(openCard).toBeTruthy();
    expect(fullCard).toBeTruthy();

    const openButton = within(openCard as HTMLElement).getByRole('button', { name: '加入房间' });
    fireEvent.click(openButton);
    expect(enterRoom).toHaveBeenCalledWith('open-1');

    const fullButton = within(fullCard as HTMLElement).getByRole('button', { name: '房间已满' });
    expect(fullButton).toBeDisabled();
    fireEvent.click(fullButton);
    expect(enterRoom).toHaveBeenCalledTimes(1);
  });
});
