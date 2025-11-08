import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import { expect, userEvent, within } from '@storybook/test';

import { SingleCard, type SingleCardProps } from './SingleCard';
import { createSampleHand } from './sampleData';

type CardStoryProps = SingleCardProps & { faceDown?: boolean };

const CardStory = ({ faceDown, faceUp = true, ...rest }: CardStoryProps) => (
  <SingleCard {...rest} faceUp={faceDown ? false : faceUp} />
);

const meta = {
  title: 'Cards/Card',
  component: CardStory,
  parameters: {
    layout: 'centered'
  },
  args: {
    rank: 'A',
    suit: 'S',
    size: 'md',
    theme: 'classic',
    shadowStrength: 'base',
    borderStyle: 'double',
    noiseOpacity: 0.18,
    faceDown: false,
    selected: false,
    'data-testid': 'storybook-card'
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
    size: {
      control: { type: 'inline-radio' },
      options: ['xs', 'sm', 'md', 'lg']
    },
    faceDown: {
      control: { type: 'boolean' }
    },
    theme: {
      control: { type: 'inline-radio' },
      options: ['classic', 'minimal', 'neon']
    },
    shadowStrength: {
      control: { type: 'inline-radio' },
      options: ['soft', 'base', 'deep']
    },
    noiseOpacity: {
      control: { type: 'range', min: 0, max: 0.4, step: 0.02 }
    },
    borderStyle: {
      control: { type: 'inline-radio' },
      options: ['double', 'single', 'minimal']
    }
  },
  decorators: [Story => (
    <div
      style={{
        background: '#0b1020',
        minHeight: '100vh',
        padding: '3rem',
        display: 'grid',
        placeItems: 'center'
      }}
    >
      <Story />
    </div>
  )],
  tags: ['autodocs']
} satisfies Meta<typeof CardStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FaceDown: Story = {
  args: {
    faceDown: true
  }
};

export const SelectedGlow: Story = {
  args: {
    selected: true,
    highlighted: true,
    meta: { selectable: true }
  }
};

export const NeonTheme: Story = {
  args: {
    rank: 'Q',
    suit: 'D',
    theme: 'neon',
    backVariant: 'neon',
    borderStyle: 'minimal',
    shadowStrength: 'deep'
  }
};

const InteractiveCard = (args: CardStoryProps) => {
  const [cardIndex, setCardIndex] = useState(0);
  const [isSelected, setSelected] = useState(false);
  const cards = useMemo(() => createSampleHand(5, 3), []);
  const activeCard = cards[cardIndex] ?? cards[0];

  return (
    <SingleCard
      {...args}
      rank={activeCard.rank}
      suit={activeCard.suit}
      meta={activeCard.meta}
      selected={isSelected}
      faceUp={!args.faceDown}
      data-testid="storybook-card"
      onClick={() => setSelected(value => !value)}
      onPointerEnter={() => setCardIndex(value => (value + 1) % cards.length)}
    />
  );
};

export const InteractiveSelect: Story = {
  args: {
    theme: 'classic',
    shadowStrength: 'base'
  },
  render: args => <InteractiveCard {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByTestId('storybook-card');
    await userEvent.hover(card);
    await userEvent.click(card);
    await expect(card).toHaveAttribute('data-selected', 'true');
  }
};
