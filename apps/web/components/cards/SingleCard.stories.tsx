import type { Meta, StoryObj } from '@storybook/react';

import { SingleCard } from './SingleCard';

const meta = {
  title: 'Cards/SingleCard',
  component: SingleCard,
  args: {
    rank: 'A',
    suit: 'S',
    faceUp: true,
    elevation: 2,
    contentScale: 1.2,
    contentOffsetX: -0.5,
    contentOffsetY: -0.5
  },
  argTypes: {
    rank: {
      control: { type: 'select' },
      options: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    },
    suit: {
      control: { type: 'select' },
      options: ['S', 'H', 'D', 'C']
    },
    contentScale: {
      control: { type: 'range', min: 0.6, max: 1.6, step: 0.05 }
    },
    contentOffsetX: {
      control: { type: 'range', min: -0.5, max: 0.5, step: 0.05 }
    },
    contentOffsetY: {
      control: { type: 'range', min: -0.5, max: 0.5, step: 0.05 }
    }
  },
  tags: ['autodocs']
} satisfies Meta<typeof SingleCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FaceDown: Story = {
  args: { faceUp: false }
};

export const Selected: Story = {
  args: {
    selected: true,
    highlighted: true,
    meta: { selectable: true }
  }
};

export const Tilted: Story = {
  args: {
    tiltDeg: -10,
    elevation: 3
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    faceUp: true
  }
};
