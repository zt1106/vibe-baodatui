import type { Meta, StoryObj } from '@storybook/react';

import { MultiCardRow } from '@poker/ui-cards';
import { createSampleRows } from './sampleData';

const baseRows = createSampleRows({ rows: 3, cardsPerRow: 6, seed: 2 });
const defaultSelectedIds = [
  baseRows[0]?.[0]?.id,
  baseRows[1]?.[1]?.id
].filter(Boolean) as string[];

const meta: Meta<typeof MultiCardRow> = {
  title: 'Components/MultiCardRow',
  component: MultiCardRow,
  args: {
    rows: baseRows,
    rowOverlap: 50,
    rowGap: 0,
    overlap: '60%',
    size: 'md',
    selectionMode: 'multiple',
    angle: -18,
    curveVerticalOffset: 20
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
    curveVerticalOffset: {
      control: { type: 'number' },
      defaultValue: 12
    },
    selectionMode: {
      control: { type: 'radio' },
      options: ['none', 'single', 'multiple']
    },
    rowOverlap: {
      control: { type: 'number' }
    },
    rowGap: {
      control: { type: 'number' }
    }
  },
  tags: ['autodocs']
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SelectableRows: Story = {
  args: {
    selectionMode: 'multiple',
    defaultSelectedIds
  }
};
