'use client';

import type { Meta, StoryObj } from '@storybook/react';

import { PokerTableBackground } from './PokerTableBackground';

const backdropStyle = {
  position: 'fixed' as const,
  inset: 0,
  margin: 0,
  padding: 0,
  background: 'radial-gradient(circle at top, rgba(16, 185, 129, 0.12), transparent 45%), #020617',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const backgroundDecorator: Meta<typeof PokerTableBackground>['decorators'] = [
  (Story, context) => {
    const alignItems = context.parameters?.backdropAlign ?? 'center';
    return (
      <div style={{ ...backdropStyle, alignItems }}>
        <Story />
      </div>
    );
  }
];

const meta: Meta<typeof PokerTableBackground> = {
  title: 'Others/TableBackground',
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
    width: '100vw',
    height: '100vh'
  },
  parameters: {
    layout: 'fullscreen',
    backdropAlign: 'flex-start'
  }
};
