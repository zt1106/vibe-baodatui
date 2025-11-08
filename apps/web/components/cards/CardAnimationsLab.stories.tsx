import type { Meta, StoryObj } from '@storybook/react';

import { CardAnimationsLab } from './CardAnimationsLab';

const meta = {
  title: 'Cards/AnimationsLab',
  component: CardAnimationsLab,
  args: {
    seats: 3,
    cardsPerSeat: 5,
    overlap: 0.4
  },
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs']
} satisfies Meta<typeof CardAnimationsLab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HeadsUp: Story = {
  args: {
    seats: 2,
    cardsPerSeat: 2,
    overlap: 0.55
  }
};
