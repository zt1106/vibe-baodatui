'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { AnimatePresence, motion } from 'framer-motion';

import type { CardId } from '@poker/core-cards';
import { CARDS_PER_PACK, createCardId } from '@poker/core-cards';

import { SingleCard } from './SingleCard';

const meta: Meta<typeof SingleCard> = {
  title: 'Cards/SingleCard',
  component: SingleCard,
  args: {
    cardId: createCardId('A', 'S'),
    faceUp: true,
    elevation: 2,
    cornerRadius: 6
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg']
    },
    cardId: {
      control: { type: 'number', min: 0, max: CARDS_PER_PACK - 1, step: 1 }
    },
    contentScale: {
      control: { type: 'range', min: 0.6, max: 1.6, step: 0.05 }
    },
    contentOffsetX: {
      control: { type: 'range', min: -0.5, max: 0.5, step: 0.05 }
    },
    contentOffsetY: {
      control: { type: 'range', min: -0.5, max: 0.5, step: 0.05 }
    },
    cornerRadius: {
      control: { type: 'range', min: 0, max: 40, step: 1 }
    }
  },
  tags: ['autodocs']
};

export default meta;

type Story = StoryObj<typeof meta>;

type DealingTarget = {
  id: string;
  label: string;
  x: number;
  y: number;
  accent: string;
};

type DealingFlight = {
  id: string;
  cardId: CardId;
  target: DealingTarget;
};

export const Default: Story = {};

export const FaceDown: Story = {
  args: { faceUp: false }
};

export const Selected: Story = {
  args: {
    selected: true,
    highlighted: true,
    meta: { selectable: true }
  }
};

export const Tilted: Story = {
  args: {
    tiltDeg: -10,
    elevation: 3
  }
};

export const DealingAnimation: Story = {
  name: 'Dealing animation',
  render: function DealingAnimationStory() {
    const seats = useMemo<DealingTarget[]>(
      () => [
        { id: 'north', label: 'Seat 1 (top)', x: 0, y: -170, accent: '#38bdf8' },
        { id: 'east', label: 'Seat 2 (right)', x: 190, y: -40, accent: '#a855f7' },
        { id: 'southEast', label: 'Seat 3 (bottom right)', x: 150, y: 150, accent: '#f472b6' },
        { id: 'southWest', label: 'Seat 4 (bottom left)', x: -150, y: 150, accent: '#22c55e' },
        { id: 'west', label: 'Seat 5 (left)', x: -190, y: -40, accent: '#facc15' }
      ],
      []
    );
    const deck = useMemo<CardId[]>(
      () => [
        createCardId('A', 'S'),
        createCardId('K', 'H'),
        createCardId('Q', 'D'),
        createCardId('J', 'C'),
        createCardId('9', 'S'),
        createCardId('8', 'D')
      ],
      []
    );
    const [inFlight, setInFlight] = useState<DealingFlight[]>([]);
    const [dealtCount, setDealtCount] = useState(0);
    const [isDealing, setIsDealing] = useState(true);
    const [faceUp, setFaceUp] = useState(true);

    const maxDeals = seats.length * 3;
    const finished = dealtCount >= maxDeals;

    useEffect(() => {
      if (!isDealing || finished) {
        return;
      }
      const timer = setTimeout(() => {
        const seat = seats[dealtCount % seats.length];
        const cardId = deck[dealtCount % deck.length];
        const id = `deal-${dealtCount}-${seat.id}`;
        setInFlight(prev => [...prev, { id, cardId, target: seat }]);
        setDealtCount(count => count + 1);
      }, 820);

      return () => clearTimeout(timer);
    }, [deck, dealtCount, finished, isDealing, seats]);

    const handleComplete = useCallback((flightId: string) => {
      setInFlight(prev => prev.filter(card => card.id !== flightId));
    }, []);

    const handleReset = useCallback(() => {
      setInFlight([]);
      setDealtCount(0);
      setIsDealing(true);
    }, []);

    const handleToggle = useCallback(() => {
      if (finished) {
        handleReset();
        return;
      }
      setIsDealing(running => !running);
    }, [finished, handleReset]);

    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div
          style={{
            position: 'relative',
            minHeight: 440,
            borderRadius: 28,
            padding: 12,
            background:
              'radial-gradient(circle at 50% 38%, rgba(56, 189, 248, 0.14), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(148, 163, 184, 0.22)',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.35)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 0,
              height: 0,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: -42,
                top: -56,
                width: 84,
                height: 112,
                borderRadius: 14,
                background: 'rgba(51, 65, 85, 0.65)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.35)',
                display: 'grid',
                placeItems: 'center',
                color: '#cbd5f5',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: 1.5
              }}
            >
              Dealer
            </div>
          </div>
          {seats.map(seat => (
            <div
              key={seat.id}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${seat.x}px, ${seat.y}px)`,
                display: 'grid',
                placeItems: 'center',
                gap: 8
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${seat.accent}, #0ea5e9)`,
                  boxShadow: '0 18px 40px rgba(14, 165, 233, 0.35)',
                  border: '1px solid rgba(148, 163, 184, 0.35)'
                }}
              />
              <div style={{ color: '#cbd5f5', fontSize: '0.85rem', opacity: 0.86 }}>
                {seat.label}
              </div>
            </div>
          ))}
          <AnimatePresence>
            {inFlight.map(flight => (
              <motion.div
                key={flight.id}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.92 }}
                animate={{
                  x: flight.target.x,
                  y: flight.target.y,
                  opacity: [0, 1, 1, 0],
                  scale: [0.92, 1, 1, 0.9]
                }}
                transition={{
                  duration: 1.1,
                  times: [0, 0.16, 0.78, 1],
                  ease: ['easeOut', 'easeOut', 'easeInOut']
                }}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 18px 28px rgba(0, 0, 0, 0.3))'
                }}
                onAnimationComplete={() => handleComplete(flight.id)}
              >
                <SingleCard cardId={flight.cardId} size="sm" faceUp={faceUp} elevation={3} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap'
          }}
        >
          <div style={{ color: '#cbd5f5', fontSize: '0.92rem' }}>
            Cards launch from the center, travel to an avatar, then fade out on arrival.{' '}
            {finished ? 'Loop complete.' : `${maxDeals - dealtCount} deals remaining.`}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={handleToggle}>
              {finished ? 'Replay loop' : isDealing ? 'Pause dealing' : 'Resume'}
            </button>
            <button type="button" onClick={() => setFaceUp(value => !value)}>
              Show {faceUp ? 'back' : 'face'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={!dealtCount && inFlight.length === 0}
            >
              Reset now
            </button>
          </div>
        </div>
      </div>
    );
  }
};
