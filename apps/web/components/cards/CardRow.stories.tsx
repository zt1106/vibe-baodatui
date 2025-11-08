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
    selectMode: 'none'
  },
  tags: ['autodocs'],
  decorators: [Story => (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '3rem 1rem', background: '#020617' }}>
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
