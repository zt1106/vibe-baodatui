'use client';

import type { Meta, StoryObj } from '@storybook/react';

import { PlayerAvatar } from './PlayerAvatar';
import { PLAYER_AVATAR_STORY_URL, PLAYER_AVATAR_SIZE } from './playerAvatarDefaults';

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
    avatarUrl: PLAYER_AVATAR_STORY_URL,
    status: 'Waiting',
    statusTone: 'warning',
    size: PLAYER_AVATAR_SIZE
  }
};
