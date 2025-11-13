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

export const AddRemoveAnimated: Story = {
  render: function AddRemoveAnimatedStory() {
    const deck = useMemo(() => createSampleHand(4, 12), []);
    const [cards, setCards] = useState(deck.slice(0, 4));
    const [nextCardIndex, setNextCardIndex] = useState(cards.length);
    const canAdd = nextCardIndex < deck.length;
    const canRemove = cards.length > 0;
    const animation = useMemo(
      () => ({
        transition: {
          type: 'spring',
          stiffness: 150,
          damping: 16,
          mass: 1.2
        },
        entryYOffset: -96
      }),
      []
    );

    const handleAddMiddle = useCallback(() => {
      if (nextCardIndex >= deck.length) {
        return;
      }
      const nextCard = deck[nextCardIndex];
      setCards(prev => {
        const insertIndex = Math.floor(prev.length / 2) + 1;
        return [...prev.slice(0, insertIndex), nextCard, ...prev.slice(insertIndex)];
      });
      setNextCardIndex(index => Math.min(deck.length, index + 1));
    }, [deck, nextCardIndex]);

    const handleRemoveMiddle = useCallback(() => {
      setCards(prev => {
        if (prev.length === 0) {
          return prev;
        }
        const removeIndex = Math.floor((prev.length - 1) / 2);
        return prev.filter((_, idx) => idx !== removeIndex);
      });
    }, []);

    const handleAddMultiple = useCallback(() => {
      if (nextCardIndex >= deck.length) {
        return;
      }
      const available = Math.min(2, deck.length - nextCardIndex);
      const newCards = deck.slice(nextCardIndex, nextCardIndex + available);
      if (newCards.length === 0) {
        return;
      }
      setCards(prev => {
        const insertIndex = Math.floor(prev.length / 2) + 1;
        return [...prev.slice(0, insertIndex), ...newCards, ...prev.slice(insertIndex)];
      });
      setNextCardIndex(index => Math.min(deck.length, index + available));
    }, [deck, nextCardIndex]);

    const handleRemoveMultiple = useCallback(() => {
      setCards(prev => {
        if (prev.length === 0) {
          return prev;
        }
        const removeCount = Math.min(2, prev.length);
        const removeIndex = Math.floor((prev.length - removeCount) / 2);
        return prev.filter((_, idx) => idx < removeIndex || idx >= removeIndex + removeCount);
      });
    }, []);

    return (
      <CardAnimationProvider layoutGroupId="storybook-card-row-add-remove">
        <div
          style={{
            borderRadius: 32,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          <h3 style={{ margin: 0 }}>Animated add/remove</h3>
          <p style={{ margin: 0, color: '#94a3b8' }}>
            Add or remove a card in the middle and watch how Framer Motion eases each transform with a very noticeable spring.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={handleAddMiddle} disabled={!canAdd}>
              Add card in middle
            </button>
            <button type="button" onClick={handleRemoveMiddle} disabled={!canRemove}>
              Remove card in middle
            </button>
            <button type="button" onClick={handleAddMultiple} disabled={!canAdd}>
              Add two cards
            </button>
            <button type="button" onClick={handleRemoveMultiple} disabled={!canRemove}>
              Remove two cards
            </button>
          </div>
          <CardRow
            cards={cards}
            size="md"
            overlap="40%"
            angle={-8}
            curveVerticalOffset={10}
            selectionMode="none"
            animation={animation}
          />
        </div>
      </CardAnimationProvider>
    );
  }
};
