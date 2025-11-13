import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useMemo, useState } from 'react';

import { makeCard } from '@poker/core-cards';
import { CardAnimationProvider, CardRow } from '@poker/ui-cards';
import { createSampleHand } from './sampleData';

const sampleCards = createSampleHand(2, 6);
const duplicateRankSuitCards = [0, 1, 2, 3].map(packIndex => ({
  ...makeCard('A', 'S', { faceUp: true, packIndex }),
  meta: {
    ownerSeat: packIndex + 1,
    selectable: true,
    tags: packIndex === 0 ? ['Primary'] : undefined
  }
}));

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

export const DuplicateRankSuit: Story = {
  args: {
    cards: duplicateRankSuitCards,
    size: 'sm',
    overlap: '32%',
    angle: -12,
    curveVerticalOffset: 18,
    selectionMode: 'multiple',
    defaultSelectedIds: [duplicateRankSuitCards[0].id]
  }
};

export const AnimatedMetadata: Story = {
  render: function AnimatedMetadataStory() {
    const baseCards = useMemo(
      () =>
        createSampleHand(42, 6).map((card, index) => {
          const tags = [
            ...(card.meta?.tags ?? []),
            'flip',
            index % 2 === 0 ? 'bounce' : undefined
          ].filter((tag): tag is string => Boolean(tag));
          return {
            ...card,
            faceUp: false,
            meta: {
              ...card.meta,
              tags
            }
          };
        }),
      []
    );
    const [cards, setCards] = useState(baseCards);
    const [revealed, setRevealed] = useState(false);

    const toggleReveal = useCallback(() => {
      setCards(prev => prev.map(card => ({ ...card, faceUp: !revealed })));
      setRevealed(prev => !prev);
    }, [revealed]);

    const rotateCards = useCallback(() => {
      setCards(prev => {
        if (prev.length <= 1) {
          return prev;
        }
        const [first, ...rest] = prev;
        return [...rest, first];
      });
    }, []);

    return (
      <CardAnimationProvider layoutGroupId="storybook-card-animations">
        <CardRow
          cards={cards}
          size="md"
          overlap="55%"
          angle={-10}
          selectionMode="none"
          curveVerticalOffset={18}
        />
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 16
          }}
        >
          <button type="button" onClick={toggleReveal}>
            {revealed ? 'Hide cards' : 'Reveal cards'}
          </button>
          <button type="button" onClick={rotateCards}>
            Move first card to end
          </button>
        </div>
        <p style={{ marginTop: 12, color: '#94a3b8', fontSize: '0.9rem' }}>
          Cards tagged with <code>flip</code> animate a 3D reveal, while the ones tagged with{' '}
          <code>bounce</code> ease into new positions with extra spring when the order changes.
        </p>
      </CardAnimationProvider>
    );
  }
};
