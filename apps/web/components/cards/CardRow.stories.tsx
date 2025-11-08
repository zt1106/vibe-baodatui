import type { Meta, StoryObj } from '@storybook/react';

import { CardRow } from '@poker/ui-cards';
import { createSampleHand } from './sampleData';

const sampleCards = createSampleHand(2, 6);

const meta: Meta<typeof CardRow> = {
  title: 'Components/CardRow',
  component: CardRow,
  args: {
    cards: sampleCards,
    size: 'md',
    overlap: '65%',
    angle: -25,
    curveVerticalOffset: 18,
    selectionMode: 'multiple',
    defaultSelectedIds: [sampleCards[2].id]
  },
  argTypes: {
    size: {
      control: { type: 'radio' },
      options: ['xs', 'sm', 'md', 'lg']
    },
    overlap: {
      control: { type: 'text' }
    },
    angle: {
      control: { type: 'range', min: -45, max: 45, step: 1 }
    },
    selectionMode: {
      control: { type: 'radio' },
      options: ['none', 'single', 'multiple']
    },
    curveVerticalOffset: {
      control: { type: 'range', min: 0, max: 48, step: 1 }
    }
  },
  tags: ['autodocs']
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Many: Story = {
  args: {
    cards: createSampleHand(5, 20),
    size: 'sm',
    overlap: '28%',
    angle: 18,
    curveVerticalOffset: 32,
    selectionMode: 'none'
  }
};

export const One: Story = {
  args: {
    cards: createSampleHand(8, 1),
    size: 'lg',
    overlap: '0%',
    angle: 0,
    selectionMode: 'single'
  }
};
