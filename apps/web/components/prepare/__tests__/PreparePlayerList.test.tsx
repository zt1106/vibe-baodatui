import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import type { TablePlayer } from '@shared/messages';

import { PreparePlayerList, type PrepareSeat } from '../PreparePlayerList';

const hostPlayer: TablePlayer = {
  userId: 1,
  nickname: 'Host One',
  avatar: '1F332.png',
  prepared: true
};

const guestPlayer: TablePlayer = {
  userId: 2,
  nickname: 'Guest Two',
  avatar: '1F333.png',
  prepared: false
};

describe('PreparePlayerList', () => {
  test('shows placeholder when no one has joined', () => {
    render(
      <PreparePlayerList
        seats={[]}
        playerCount={0}
        capacity={3}
        status="ready"
        error={null}
        isHost={false}
      />
    );

    expect(screen.getByText('暂未有人加入，快邀请朋友一起准备吧！')).toBeInTheDocument();
  });

  test('marks host seat and allows kicking other players', () => {
    const seats: PrepareSeat[] = [
      { seatNumber: 1, player: hostPlayer },
      { seatNumber: 2, player: guestPlayer },
      { seatNumber: 3, player: null }
    ];
    const kickPlayer = vi.fn();

    render(
      <PreparePlayerList
        seats={seats}
        playerCount={2}
        capacity={3}
        status="ready"
        isHost
        hostUserId={hostPlayer.userId}
        currentUserId={hostPlayer.userId}
        onKickPlayer={kickPlayer}
      />
    );

    const list = screen.getByTestId('prepare-player-list');
    const hostCard = within(list).getByText(hostPlayer.nickname).closest('article');
    const guestCard = within(list).getByText(guestPlayer.nickname).closest('article');
    expect(hostCard).toBeTruthy();
    expect(guestCard).toBeTruthy();

    expect(within(hostCard as HTMLElement).getByText('房主')).toBeInTheDocument();
    expect(within(guestCard as HTMLElement).queryByText('房主')).toBeNull();

    const kickButton = within(guestCard as HTMLElement).getByRole('button', { name: '移出' });
    fireEvent.click(kickButton);
    expect(kickPlayer).toHaveBeenCalledWith(guestPlayer.userId);
  });
});
