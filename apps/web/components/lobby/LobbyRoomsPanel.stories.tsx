'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import type { LobbyRoom } from '@shared/messages';

import { LobbyRoomsPanel } from './LobbyRoomsPanel';

const sampleRooms: LobbyRoom[] = [
  { id: '1024', status: 'waiting', players: 2, capacity: 6 },
  { id: '2048', status: 'in-progress', players: 4, capacity: 6 },
  { id: '4096', status: 'waiting', players: 1, capacity: 8 },
  { id: '8192', status: 'full', players: 8, capacity: 8 },
  { id: '16384', status: 'waiting', players: 5, capacity: 8 }
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

export const NarrowViewport: Story = {
  args: {
    rooms: sampleRooms.slice(0, 2),
    status: 'ready'
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
};
