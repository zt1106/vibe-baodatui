'use client';

import type { Meta, StoryObj } from '@storybook/react';

import type { CardId } from '@poker/core-cards';
import { CARDS_PER_PACK, createCardId } from '@poker/core-cards';

import { SingleCard } from './SingleCard';

const meta: Meta<typeof SingleCard> = {
  title: 'Cards/SingleCard',
  component: SingleCard,
  args: {
    cardId: createCardId('A', 'S'),
    faceUp: true,
    elevation: 2
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg']
    },
    cardId: {
      control: { type: 'number', min: 0, max: CARDS_PER_PACK - 1, step: 1 }
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
};

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
