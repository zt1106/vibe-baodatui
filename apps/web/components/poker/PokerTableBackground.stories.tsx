'use client';

import type { Meta, StoryObj } from '@storybook/react';

import { PokerTableBackground } from './PokerTableBackground';

const backdropStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at top, rgba(16, 185, 129, 0.12), transparent 45%), #020617',
  padding: '3rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const backgroundDecorator: Meta<typeof PokerTableBackground>['decorators'] = [
  Story => (
    <div style={backdropStyle}>
      <Story />
    </div>
  )
];

const meta: Meta<typeof PokerTableBackground> = {
  title: 'Poker/TableBackground',
  component: PokerTableBackground,
  decorators: backgroundDecorator,
  args: {
    width: 540,
    height: 320
  },
  tags: ['autodocs']
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Classic: Story = {};

export const ScreenFit: Story = {
  args: {
    width: '80vw',
    height: '80vh'
  },
  parameters: {
    layout: 'fullscreen'
  }
};
