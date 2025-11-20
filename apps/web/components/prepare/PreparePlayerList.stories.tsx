'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { PreparePlayerList, type PrepareSeat } from './PreparePlayerList';

const seatPlayers = [
  { userId: 11, nickname: '晨星', avatar: '1F42D.png', prepared: true },
  { userId: 22, nickname: '夜行', avatar: '1F436.png', prepared: false },
  { userId: 33, nickname: '南城', avatar: '1F43B.png', prepared: true },
  { userId: 44, nickname: '北风', avatar: '1F981.png', prepared: false }
] as const;

const totalSeats = 6;
const filledSeats: PrepareSeat[] = Array.from({ length: totalSeats }, (_, index) => ({
  seatNumber: index + 1,
  player: seatPlayers[index] ?? null
}));

const hostId = seatPlayers[0].userId;
const playerCount = seatPlayers.length;

const meta: Meta<typeof PreparePlayerList> = {
  title: 'Prepare/PreparePlayerList',
  component: PreparePlayerList,
  tags: ['autodocs'],
  args: {
    seats: filledSeats,
    playerCount,
    capacity: totalSeats,
    status: 'ready',
    isHost: true,
    hostUserId: hostId,
    currentUserId: hostId,
    onKickPlayer: fn()
  },
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    Story => (
      <div
        style={{
          background: '#020617',
          minHeight: '100vh',
          padding: '2rem',
          boxSizing: 'border-box'
        }}
      >
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof meta>;

export const HostView: Story = {};

export const GuestView: Story = {
  args: {
    isHost: false,
    currentUserId: seatPlayers[1].userId
  }
};

export const LoadingState: Story = {
  args: {
    status: 'loading',
    seats: [],
    playerCount: 0,
    capacity: 8
  }
};

export const ErrorState: Story = {
  args: {
    status: 'error',
    error: '暂时无法加载房间信息。',
    seats: filledSeats
  }
};
