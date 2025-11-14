'use client';

import type { Meta, StoryObj } from '@storybook/react';

import { PokerTableBackground } from './PokerTableBackground';

const meta: Meta<typeof PokerTableBackground> = {
  title: 'Poker/TableBackground',
  component: PokerTableBackground,
  args: {
    width: 540,
    height: 320
  },
  tags: ['autodocs']
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Classic: Story = {};
