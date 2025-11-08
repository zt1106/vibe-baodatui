import type { Meta, StoryObj } from '@storybook/react';

import { MultiRow } from './MultiRow';
import { createSampleRows } from './sampleData';

const meta = {
  title: 'Cards/MultiRow',
  component: MultiRow,
  args: {
    rows: createSampleRows(),
    overlap: 0.4,
    alternateOrientation: true
  },
  tags: ['autodocs']
} satisfies Meta<typeof MultiRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HeadsUp: Story = {
  args: {
    rows: createSampleRows({ rows: 2, cardsPerRow: 2 }),
    overlap: 0.5,
    align: 'center'
  }
};

export const TableOfSix: Story = {
  args: {
    rows: createSampleRows({ rows: 6, seed: 3 }),
    rowGap: 24,
    overlap: 0.3,
    align: 'right'
  }
};
