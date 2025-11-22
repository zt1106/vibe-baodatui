import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import type { LobbyNotification } from '@shared/messages';
import { GAME_VARIANTS } from '@shared/variants';

import { LobbyTopBar } from './LobbyTopBar';

const notifications: LobbyNotification[] = [
  {
    id: 'notice-1',
    message: '新锦标赛开放报名',
    tone: 'info'
  },
  {
    id: 'notice-2',
    message: '午夜巡回赛将在 10 分钟后开始',
    tone: 'warning'
  }
];

const meta: Meta<typeof LobbyTopBar> = {
  title: 'Lobby/LobbyTopBar',
  component: LobbyTopBar,
  tags: ['autodocs'],
  args: {
    roomsCount: 8,
    notifications,
    authStatus: 'ready',
    isCreatingRoom: false,
    user: {
      id: 101,
      nickname: '晨星',
      avatar: '1F42D.png'
    },
    variants: GAME_VARIANTS,
    selectedVariantId: GAME_VARIANTS[0].id,
    onBackHome: fn(),
    onCreateRoom: fn(),
    onOpenAvatarDialog: fn(),
    onOpenNameDialog: fn()
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

export const Default: Story = {};

export const LoadingAuth: Story = {
  args: {
    authStatus: 'loading',
    user: null
  }
};

export const ErrorState: Story = {
  args: {
    authStatus: 'error',
    user: null,
    error: '无法登录，请稍后重试。',
    notifications: []
  }
};
