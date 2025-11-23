'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import type { LobbyRoom } from '@shared/messages';

import { LobbyRoomsPanel } from './LobbyRoomsPanel';

const classicVariant: LobbyRoom['variant'] = {
  id: 'classic',
  name: '经典德州扑克',
  description: '无限注，标准桌',
  capacity: { min: 2, max: 8 }
};

const shortDeckVariant: LobbyRoom['variant'] = {
  id: 'short-deck',
  name: '短牌极速',
  description: '36 张短牌，快节奏',
  capacity: { min: 2, max: 6 }
};

const sampleRooms: LobbyRoom[] = [
  { id: '1024', status: 'waiting', players: 2, capacity: 6, variant: shortDeckVariant },
  { id: '2048', status: 'in-progress', players: 4, capacity: 6, variant: shortDeckVariant },
  { id: '4096', status: 'waiting', players: 1, capacity: 8, variant: classicVariant },
  { id: '8192', status: 'full', players: 8, capacity: 8, variant: classicVariant },
  { id: '16384', status: 'waiting', players: 5, capacity: 8, variant: classicVariant }
];

const meta: Meta<typeof LobbyRoomsPanel> = {
  title: 'Lobby/LobbyRoomsPanel',
  component: LobbyRoomsPanel,
  tags: ['autodocs'],
  args: {
    rooms: sampleRooms,
    status: 'ready',
    onEnterRoom: fn()
  },
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    Story => (
      <div
        style={{
          background: '#0f172a',
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

export const ActiveRooms: Story = {};

export const LoadingState: Story = {
  args: { status: 'loading' }
};

export const EmptyRooms: Story = {
  args: {
    rooms: [],
    status: 'ready'
  }
};

export const ErrorState: Story = {
  args: {
    status: 'error',
    rooms: []
  }
};
