import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { motion } from 'framer-motion';

import { getCardDimensions, makeCard, type Card } from '@poker/core-cards';
import {
  CardAnimationProvider,
  CardRow,
  PlayingCard,
  type CardAnimationOptions,
  type CardRowProps
} from '@poker/ui-cards';
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

const AVATAR_POSITION = { x: 40, y: 32 };
const TARGET_ROW_OFFSET = { left: 64, top: 220 };
const TARGET_ROW_ANGLE = 0;
const TARGET_ROW_CURVE = 0;
const TARGET_ROW_OVERLAP = '32%' as const;
const INCOMING_TRANSITION = {
  type: 'spring',
  stiffness: 340,
  damping: 38,
  mass: 0.95,
  bounce: 0
};
const TARGET_ROW_ANIMATION: CardAnimationOptions = {
  disabled: true
};
const CARD_SIZE = getCardDimensions('md');
const STORY_LAYOUT_STYLE = {
  borderRadius: 32,
  padding: 24,
  background: 'rgba(15, 23, 42, 0.95)',
  display: 'flex',
  flexDirection: 'column',
  gap: 24
} as const;

const INCOMING_AREA_STYLE = {
  position: 'relative',
  minHeight: 420,
  borderRadius: 28,
  background: 'radial-gradient(circle at 48px 32px, rgba(56, 189, 248, 0.15), transparent 45%)',
  padding: 16,
  paddingBottom: 48,
  overflow: 'visible'
} as const;

const AVATAR_MARKER_STYLE = {
  position: 'absolute',
  left: AVATAR_POSITION.x,
  top: AVATAR_POSITION.y,
  display: 'flex',
  alignItems: 'center',
  gap: 10
} as const;

const AVATAR_BADGE_STYLE = {
  width: 52,
  height: 52,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
  boxShadow: '0 18px 30px rgba(37, 99, 235, 0.45)'
} as const;

const PLAY_AREA_STYLE = {
  position: 'absolute',
  left: TARGET_ROW_OFFSET.left,
  top: TARGET_ROW_OFFSET.top,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  zIndex: 1,
  width: '100%'
} as const;

const CONTROLS_STYLE = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap'
} as const;

const DESCRIPTION_TEXT_STYLE = {
  margin: 0,
  color: '#94a3b8',
  fontSize: '0.95rem'
} as const;

const QUEUE_TEXT_STYLE = {
  color: '#cbd5f5',
  fontSize: '0.95rem'
} as const;

const INCOMING_CARD_STYLE = {
  position: 'absolute',
  width: CARD_SIZE.width,
  height: CARD_SIZE.height,
  pointerEvents: 'none',
  zIndex: 2
} as const;

function resolveOverlapPx(overlap: CardRowProps['overlap'], cardWidth: number) {
  if (typeof overlap === 'string' && overlap.endsWith('%')) {
    const parsed = Number.parseFloat(overlap);
    if (Number.isFinite(parsed)) {
      return (Math.max(0, Math.min(parsed, 100)) / 100) * cardWidth;
    }
    return 0;
  }
  return Number.isFinite(Number(overlap)) ? Number(overlap) : 0;
}

const meta: Meta<typeof CardRow> = {
  title: 'Cards/CardRow',
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
    const animation = useMemo<CardAnimationOptions>(
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

export const TransferBetweenRows: Story = {
  render: function TransferBetweenRowsStory() {
    const baseDeck = useMemo(() => createSampleHand(5, 20), []);
    const [rowA, setRowA] = useState(baseDeck.slice(0, 6));
    const [rowB, setRowB] = useState(baseDeck.slice(6, 12));

    const moveOne = useCallback(
      (setFrom: Dispatch<SetStateAction<Card[]>>, setTo: Dispatch<SetStateAction<Card[]>>) => {
        setFrom(prev => {
          if (prev.length === 0) {
            return prev;
          }
          const moving = prev[prev.length - 1];
          setTo(target => [...target, moving]);
          return prev.slice(0, -1);
        });
      },
      []
    );

    const moveMultiple = useCallback(
      (setFrom: Dispatch<SetStateAction<Card[]>>, setTo: Dispatch<SetStateAction<Card[]>>) => {
        setFrom(prev => {
          if (prev.length === 0) {
            return prev;
          }
          const count = Math.min(2, prev.length);
          const moving = prev.slice(prev.length - count);
          setTo(target => [...target, ...moving]);
          return prev.slice(0, prev.length - count);
        });
      },
      []
    );

    const slowStableAnimation = useMemo<CardAnimationOptions>(
      () => ({
        transition: {
          type: 'tween',
          duration: 0.45,
          ease: 'easeInOut'
        },
        entryYOffset: 0
      }),
      []
    );

    return (
      <CardAnimationProvider layoutGroupId="storybook-card-row-transfer">
        <div
          style={{
            borderRadius: 32,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}
        >
          <h3 style={{ margin: 0 }}>Move cards between rows</h3>
          <p style={{ margin: 0, color: '#94a3b8' }}>
            Transfer cards between the two rows to see how shared layout animations keep each card gliding to its new container.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => moveOne(setRowA, setRowB)} disabled={rowA.length === 0}>
              Move one → B
            </button>
            <button type="button" onClick={() => moveOne(setRowB, setRowA)} disabled={rowB.length === 0}>
              Move one → A
            </button>
            <button type="button" onClick={() => moveMultiple(setRowA, setRowB)} disabled={rowA.length < 2}>
              Move two → B
            </button>
            <button type="button" onClick={() => moveMultiple(setRowB, setRowA)} disabled={rowB.length < 2}>
              Move two → A
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <p style={{ margin: '0 0 8px', color: '#94a3b8' }}>Row A</p>
              <CardRow
                cards={rowA}
                size="md"
                overlap="30%"
                selectionMode="none"
                animation={slowStableAnimation}
              />
            </div>
            <div>
              <p style={{ margin: '0 0 8px', color: '#94a3b8' }}>Row B</p>
              <CardRow
                cards={rowB}
                size="md"
                overlap="30%"
                selectionMode="none"
                animation={slowStableAnimation}
              />
            </div>
          </div>
        </div>
      </CardAnimationProvider>
    );
}
};

export const IncomingFromAvatar: Story = {
  args: {
    angle: TARGET_ROW_ANGLE,
    overlap: TARGET_ROW_OVERLAP,
    curveVerticalOffset: TARGET_ROW_CURVE
  },
  render: function IncomingFromAvatarStory({
    angle = TARGET_ROW_ANGLE,
    overlap = TARGET_ROW_OVERLAP,
    curveVerticalOffset = TARGET_ROW_CURVE
  }) {
    const deck = useMemo(() => createSampleHand(1, 6), []);
    const [queue, setQueue] = useState<Card[]>(deck);
    const [playedCards, setPlayedCards] = useState<Card[]>([]);
    const [incomingCard, setIncomingCard] = useState<{
      card: Card;
      target: { x: number; y: number };
    } | null>(null);

    const rowSpacing = useMemo(
      () => Math.max(0, CARD_SIZE.width - resolveOverlapPx(overlap, CARD_SIZE.width)),
      [overlap]
    );

    const handlePlayCard = useCallback(() => {
      if (queue.length === 0 || incomingCard !== null) {
        return;
      }
      const [nextCard, ...rest] = queue;
      const targetIndex = playedCards.length;
      setIncomingCard({
        card: nextCard,
        target: {
          x: TARGET_ROW_OFFSET.left + targetIndex * rowSpacing,
          y: TARGET_ROW_OFFSET.top
        }
      });
      setQueue(rest);
    }, [incomingCard, queue, playedCards.length, rowSpacing]);

    const handleReset = useCallback(() => {
      setQueue(deck);
      setPlayedCards([]);
      setIncomingCard(null);
    }, [deck]);

    const handleIncomingComplete = useCallback(() => {
      if (!incomingCard) {
        return;
      }
      setPlayedCards(prev => [...prev, incomingCard.card]);
      setIncomingCard(null);
    }, [incomingCard]);

    return (
      <CardAnimationProvider layoutGroupId="story-card-row-incoming">
        <div style={STORY_LAYOUT_STYLE}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h3 style={{ margin: 0 }}>Opponent plays into an empty row</h3>
            <p style={DESCRIPTION_TEXT_STYLE}>
              Cards spawn from the invisible avatar source and glide toward the zero-degree playing row.
            </p>
          </div>
          <div style={INCOMING_AREA_STYLE}>
            <div style={AVATAR_MARKER_STYLE}>
              <div
                style={AVATAR_BADGE_STYLE}
              />
              <div style={{ color: '#cbd5f5', fontSize: '0.95rem' }}>Other player avatar</div>
            </div>
            {incomingCard && (
              <motion.div
                key={`${incomingCard.card.id}-${incomingCard.target.x}-${incomingCard.target.y}`}
                initial={{
                  x: AVATAR_POSITION.x,
                  y: AVATAR_POSITION.y,
                  opacity: 0,
                  scale: 0.92
                }}
                animate={{
                  x: incomingCard.target.x,
                  y: incomingCard.target.y,
                  opacity: 1,
                  scale: 1
                }}
                transition={INCOMING_TRANSITION}
                onAnimationComplete={handleIncomingComplete}
                style={INCOMING_CARD_STYLE}
              >
                <PlayingCard card={incomingCard.card} size="md" faceUp />
              </motion.div>
            )}
            <div style={PLAY_AREA_STYLE}>
              <p style={DESCRIPTION_TEXT_STYLE}>Incoming playing area</p>
              <CardRow
                cards={playedCards}
                size="md"
                overlap={overlap}
                angle={angle}
                curveVerticalOffset={curveVerticalOffset}
                selectionMode="none"
                animation={TARGET_ROW_ANIMATION}
              />
            </div>
          </div>
          <div style={CONTROLS_STYLE}>
            <div style={QUEUE_TEXT_STYLE}>
              {queue.length} card{queue.length === 1 ? '' : 's'} remaining in the invisible source
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={handlePlayCard} disabled={queue.length === 0 || incomingCard !== null}>
                Play card from avatar
              </button>
              <button type="button" onClick={handleReset} disabled={!queue.length && !playedCards.length && incomingCard === null}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </CardAnimationProvider>
    );
  }
};
