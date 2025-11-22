'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { createCardId, makeCard } from '@poker/core-cards';
import type { Card } from '@poker/core-cards';
import type { CardRowSize } from '@poker/ui-cards';

import { GameTableStage } from './GameTableStage';
import { type DealingCardFlight, type GameTableSeat } from './GameTable';
import { LOCAL_PLAYER_AVATAR_URLS } from './playerAvatarDefaults';

const basePlayerStubs: GameTableSeat[] = [
  {
    id: 'seat-1',
    nickname: '楚河',
    avatar: '1F42D.png',
    status: '思考中',
    stack: 4820,
    cards: [
      makeCard('A', 'S', { faceUp: true }),
      makeCard('K', 'S', { faceUp: true })
    ]
  },
  {
    id: 'seat-2',
    nickname: '小白',
    avatar: '1F431.png',
    status: '跟注',
    stack: 3180,
    cards: [
      makeCard('9', 'H', { faceUp: false }),
      makeCard('9', 'C', { faceUp: false })
    ]
  },
  {
    id: 'seat-3',
    nickname: '阿瑶',
    avatar: '1F43C.png',
    status: '等待行动',
    stack: 5520,
    cards: [
      makeCard('Q', 'D', { faceUp: true }),
      makeCard('J', 'D', { faceUp: true })
    ]
  },
  {
    id: 'seat-4',
    nickname: '北风',
    avatar: '1F981.png',
    status: '弃牌',
    stack: 2490,
    cards: [
      makeCard('8', 'C', { faceUp: false }),
      makeCard('7', 'C', { faceUp: false })
    ]
  },
  {
    id: 'seat-5',
    nickname: '酒馆老板',
    avatar: '1F43B.png',
    status: '加注',
    stack: 6100,
    cards: [
      makeCard('A', 'H', { faceUp: true }),
      makeCard('5', 'H', { faceUp: true })
    ]
  },
  {
    id: 'seat-6',
    nickname: '南城',
    avatar: '1F42E.png',
    status: '跟注',
    stack: 3320,
    cards: [
      makeCard('K', 'D', { faceUp: false }),
      makeCard('2', 'D', { faceUp: false })
    ]
  },
  {
    id: 'seat-7',
    nickname: '青衣',
    avatar: '1F430.png',
    status: '观望',
    stack: 2980,
    cards: [
      makeCard('4', 'H', { faceUp: false }),
      makeCard('8', 'D', { faceUp: false })
    ]
  },
  {
    id: 'seat-8',
    nickname: '夜行',
    avatar: '1F436.png',
    status: '包牌',
    stack: 5140,
    cards: [
      makeCard('6', 'S', { faceUp: true }),
      makeCard('6', 'D', { faceUp: true })
    ]
  }
];

const pickRandomAvatar = () =>
  LOCAL_PLAYER_AVATAR_URLS[Math.floor(Math.random() * LOCAL_PLAYER_AVATAR_URLS.length)];

const playerStubs = basePlayerStubs.map(player => ({
  ...player,
  avatarUrl: pickRandomAvatar()
}));
const playerStubsNoCards = playerStubs.map(player => ({ ...player, cards: [] }));

const flopToRiver = [
  makeCard('10', 'S', { faceUp: true }),
  makeCard('J', 'C', { faceUp: true }),
  makeCard('Q', 'C', { faceUp: true }),
  makeCard('2', 'S', { faceUp: true }),
  makeCard('3', 'H', { faceUp: true })
];

const sampleHandCards = [
  makeCard('A', 'S', { faceUp: true }),
  makeCard('K', 'S', { faceUp: true }),
  makeCard('Q', 'S', { faceUp: true }),
  makeCard('5', 'H', { faceUp: true }),
  makeCard('5', 'D', { faceUp: true }),
  makeCard('5', 'C', { faceUp: true }),
  makeCard('9', 'H', { faceUp: true })
];
const dealingCardIds = [
  createCardId('A', 'S'),
  createCardId('K', 'H'),
  createCardId('Q', 'C'),
  createCardId('J', 'D')
];

type TableStoryArgs = {
  playerCount: number;
  handCardSize?: CardRowSize;
  seatCardSize?: CardRowSize;
  communityCardSize?: CardRowSize;
  handSectionOverlap?: number;
  handCards?: Card[];
  handGrouping?: 'byColor' | 'bySuit';
};

const meta: Meta<typeof GameTableStage, TableStoryArgs> = {
  title: 'Table/GameTable',
  component: GameTableStage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    playerCount: 8,
    sceneWidth: '80%',
    sceneHeight: '520px',
    sceneAlign: 'center',
    handCards: sampleHandCards,
    handGrouping: 'byColor',
    handCardAngle: -10,
    handCardCurveVerticalOffset: 16,
    handCardOverlap: '55%',
    handCardRowGap: 0,
    handCardRowOverlap: 40,
    handCardSize: 'md',
    seatCardSize: 'sm',
    communityCardSize: 'md',
    avatarRingScale: 1.08,
    cardRingScale: 0.66,
    handSectionOverlap: 32
  },
  argTypes: {
    playerCount: {
      control: { type: 'number', min: 3, max: 8, step: 1 }
    },
    sceneWidth: { control: 'text' },
    sceneHeight: { control: 'text' },
    sceneAlign: {
      control: { type: 'radio' },
      options: ['flex-start', 'center', 'flex-end']
    },
    handGrouping: {
      control: { type: 'radio' },
      options: ['byColor', 'bySuit']
    },
    handCardAngle: {
      control: { type: 'number', min: -30, max: 30, step: 1 }
    },
    handCardCurveVerticalOffset: {
      control: { type: 'number', min: -50, max: 50, step: 1 }
    },
    handCardOverlap: { control: 'text' },
    handCardRowGap: {
      control: { type: 'number', min: 0, max: 48, step: 2 }
    },
    handCardRowOverlap: {
      control: { type: 'number', min: 0, max: 60, step: 2 }
    },
    handCardSize: {
      control: { type: 'radio' },
      options: ['xs', 'sm', 'md', 'lg']
    },
    seatCardSize: {
      control: { type: 'radio' },
      options: ['xs', 'sm', 'md', 'lg']
    },
    communityCardSize: {
      control: { type: 'radio' },
      options: ['xs', 'sm', 'md', 'lg']
    },
    handSectionOverlap: {
      control: { type: 'number', min: 0, max: 240, step: 4 }
    },
    avatarRingScale: {
      control: { type: 'number', min: 0.4, max: 1.6, step: 0.02 }
    },
    cardRingScale: {
      control: { type: 'number', min: 0.3, max: 1.4, step: 0.02 }
    }
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const FullTable: Story = {
  args: {
    communityCards: flopToRiver,
    dealerSeatId: 'seat-3',
    sceneWidth: '100vw',
    sceneHeight: '100vh',
    handCards: sampleHandCards
  },
  render: ({ playerCount, ...storyArgs }) => (
    <GameTableStage players={playerStubs.slice(0, playerCount)} {...storyArgs} />
  )
};

export const EmptyCards: Story = {
  args: {
    playerCount: 8,
    sceneWidth: '100vw',
    sceneHeight: '100vh',
    sceneAlign: 'center',
    communityCards: [],
    handCards: [],
    handGrouping: 'byColor',
    handCardRows: [],
    handCardAngle: -10,
    handCardCurveVerticalOffset: 16,
    handCardOverlap: '55%',
    handCardRowGap: 0,
    handCardRowOverlap: 40,
    handCardSize: 'md',
    seatCardSize: 'sm',
    communityCardSize: 'md',
    avatarRingScale: 1.08,
    cardRingScale: 0.66,
    handSectionOverlap: 32
  },
  render: ({ playerCount, ...storyArgs }) => (
    <GameTableStage players={playerStubsNoCards.slice(0, playerCount)} {...storyArgs} />
  )
};

export const Dealing: Story = {
  args: {
    playerCount: 6,
    communityCards: [],
    handCards: [],
    handCardRows: [],
    handSectionOverlap: 16,
    sceneHeight: '520px',
    sceneWidth: '80vw',
    sceneAlign: 'center',
    handCardAngle: -8,
    handCardCurveVerticalOffset: 12,
    handCardOverlap: '55%',
    handCardRowGap: 0,
    handCardRowOverlap: 40,
    handCardSize: 'md',
    seatCardSize: 'sm',
    communityCardSize: 'md',
    avatarRingScale: 1.08,
    cardRingScale: 0.62
  },
  render: ({ playerCount, ...storyArgs }) => {
    const players = useMemo(() => playerStubsNoCards.slice(0, playerCount), [playerCount]);
    const targetSeatIds = useMemo(
      () => players.map(player => player.id),
      [players]
    );
    const maxDeals = targetSeatIds.length ? targetSeatIds.length * 2 : 0;
    const [dealingIndex, setDealingIndex] = useState(0);
    const [inFlight, setInFlight] = useState<DealingCardFlight[]>([]);

    useEffect(() => {
      setDealingIndex(0);
      setInFlight([]);
    }, [playerCount]);

    useEffect(() => {
      if (maxDeals === 0 || dealingIndex >= maxDeals) {
        return;
      }
      const timer = setTimeout(() => {
        const seatId = targetSeatIds[dealingIndex % targetSeatIds.length];
        const cardId = dealingCardIds[dealingIndex % dealingCardIds.length];
        const id = `deal-${dealingIndex}-${seatId}`;
        setInFlight(prev => [...prev, { id, seatId, cardId, faceUp: false }]);
        setDealingIndex(index => index + 1);
      }, 780);

      return () => clearTimeout(timer);
    }, [dealingIndex, maxDeals, targetSeatIds]);

    const handleDealingComplete = useCallback((flightId: string) => {
      setInFlight(prev => prev.filter(card => card.id !== flightId));
    }, []);

    return (
      <GameTableStage
        players={players}
        dealingCards={inFlight}
        onDealingCardComplete={handleDealingComplete}
        {...storyArgs}
      />
    );
  }
};
