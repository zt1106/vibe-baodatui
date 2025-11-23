import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { motion } from 'framer-motion';

import { type Card } from '@poker/core-cards';
import {
  CardAnimationProvider,
  CardRow,
  PlayingCard,
  type CardAnimationOptions,
  type CardRowProps
} from '@poker/ui-cards';

import { createSampleHand } from './sampleData';
import {
  AVATAR_BADGE_STYLE,
  AVATAR_MARKER_STYLE,
  AVATAR_POSITION,
  CARD_SIZE,
  CONTROLS_STYLE,
  DESCRIPTION_TEXT_STYLE,
  INCOMING_AREA_STYLE,
  INCOMING_CARD_STYLE,
  INCOMING_TRANSITION,
  PLAY_AREA_STYLE,
  QUEUE_TEXT_STYLE,
  STORY_LAYOUT_STYLE,
  TARGET_ROW_ANIMATION,
  TARGET_ROW_ANGLE,
  TARGET_ROW_CURVE,
  TARGET_ROW_OFFSET,
  TARGET_ROW_OVERLAP,
  buildPanelStyle,
  resolveOverlapPx
} from './CardRow.story-helpers';

type PanelStateSetter = Dispatch<SetStateAction<Card[]>>;

export function AnimatedMetadataStory() {
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

export function AddRemoveAnimatedStory() {
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
      <div style={buildPanelStyle(16)}>
        <h3 style={{ margin: 0 }}>Animated add/remove</h3>
        <p style={{ margin: 0, color: '#94a3b8' }}>
          Add or remove a card in the middle and watch how Framer Motion eases each transform with a
          very noticeable spring.
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

export function TransferBetweenRowsStory() {
  const baseDeck = useMemo(() => createSampleHand(5, 20), []);
  const [rowA, setRowA] = useState(baseDeck.slice(0, 6));
  const [rowB, setRowB] = useState(baseDeck.slice(6, 12));

  const moveOne = useCallback(
    (setFrom: PanelStateSetter, setTo: PanelStateSetter) => {
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
    (setFrom: PanelStateSetter, setTo: PanelStateSetter) => {
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
      <div style={buildPanelStyle(20)}>
        <h3 style={{ margin: 0 }}>Move cards between rows</h3>
        <p style={{ margin: 0, color: '#94a3b8' }}>
          Transfer cards between the two rows to see how shared layout animations keep each card
          gliding to its new container.
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

type IncomingStoryArgs = Pick<CardRowProps, 'angle' | 'overlap' | 'curveVerticalOffset'>;

export function IncomingFromAvatarStory({
  angle = TARGET_ROW_ANGLE,
  overlap = TARGET_ROW_OVERLAP,
  curveVerticalOffset = TARGET_ROW_CURVE
}: IncomingStoryArgs) {
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
            Cards spawn from the invisible avatar source and glide toward the zero-degree playing
            row.
          </p>
        </div>
        <div style={INCOMING_AREA_STYLE}>
          <div style={AVATAR_MARKER_STYLE}>
            <div style={AVATAR_BADGE_STYLE} />
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
              <PlayingCard card={incomingCard.card} size="md" />
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
