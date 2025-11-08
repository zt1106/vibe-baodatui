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
    overlap: '35%',
    angle: 12,
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
    selectionMode: 'none'
  }
};
