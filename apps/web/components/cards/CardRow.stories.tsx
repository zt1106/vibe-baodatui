import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';

import { CardRow } from '@poker/ui-cards';

import { createSampleHand } from './sampleData';

const meta = {
  title: 'Cards/CardRow',
  component: CardRow,
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    cards: createSampleHand(),
    overlap: 0.4,
    selectMode: 'none',
    size: 'md',
    align: 'center',
    orientation: 'bottom'
  },
  argTypes: {
    size: {
      control: { type: 'inline-radio' },
      options: ['xs', 'sm', 'md', 'lg']
    },
    align: {
      control: { type: 'radio' },
      options: ['left', 'center', 'right']
    },
    orientation: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom']
    },
    overlap: {
      control: { type: 'range', min: 0.2, max: 0.8, step: 0.05 }
    }
  },
  tags: ['autodocs'],
  decorators: [Story => (
    <div
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: '4rem 2rem',
        background: 'radial-gradient(circle at 20% 20%, rgba(32, 54, 94, 0.45), rgba(3, 7, 18, 0.95))'
      }}
    >
      <Story />
    </div>
  )]
} satisfies Meta<typeof CardRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TightOverlap: Story = {
  args: {
    overlap: 0.65,
    cards: createSampleHand(2)
  }
};

export const CustomAlignment: Story = {
  args: {
    cards: createSampleHand(3),
    align: 'left',
    orientation: 'top'
  }
};

export const Selectable: Story = {
  render: args => {
    const [selected, setSelected] = useState<string[]>([]);
    const cards = useMemo(() => createSampleHand(4), []);
    return (
      <CardRow
        {...args}
        cards={cards}
        selectMode="multi"
        selectedIds={selected}
        onSelect={(next) => setSelected(next)}
      />
    );
  }
};
