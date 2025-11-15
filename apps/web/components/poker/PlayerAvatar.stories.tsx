'use client';

import type { Meta, StoryObj } from '@storybook/react';

import { PlayerAvatar } from './PlayerAvatar';

const meta: Meta<typeof PlayerAvatar> = {
  title: 'Others/PlayerAvatar',
  component: PlayerAvatar,
  tags: ['autodocs']
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    playerName: 'Bao Dat',
    avatarUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&q=80',
    status: 'Waiting',
    statusTone: 'warning'
  }
};

export const TeamLead: Story = {
  args: {
    playerName: 'Mira Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    status: 'On a streak',
    statusTone: 'success',
    score: 18450,
    teamName: 'Emerald Squad',
    infoRows: [
      { label: 'Round', value: 'Quarterfinals' },
      { label: 'Chips', value: '24,900' }
    ]
  }
};
