'use client';

import type { Meta, StoryObj } from '@storybook/react';

import { PlayerAvatar } from './PlayerAvatar';

const meta: Meta<typeof PlayerAvatar> = {
  title: 'Table/PlayerAvatar',
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
