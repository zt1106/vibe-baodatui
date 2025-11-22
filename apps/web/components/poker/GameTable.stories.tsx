'use client';

import type { Meta, StoryObj } from '@storybook/react';

import { makeCard } from '@poker/core-cards';
import type { CardRowSize } from '@poker/ui-cards';

import { GameTable, type GameTableSeat } from './GameTable';
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

const flopToRiver = [
  makeCard('10', 'S', { faceUp: true }),
  makeCard('J', 'C', { faceUp: true }),
  makeCard('Q', 'C', { faceUp: true }),
  makeCard('2', 'S', { faceUp: true }),
  makeCard('3', 'H', { faceUp: true })
];

const sampleHandRows = [
  [
    makeCard('A', 'S', { faceUp: true }),
    makeCard('K', 'S', { faceUp: true }),
    makeCard('Q', 'S', { faceUp: true })
  ],
  [
    makeCard('5', 'H', { faceUp: true }),
    makeCard('5', 'D', { faceUp: true }),
    makeCard('5', 'C', { faceUp: true }),
    makeCard('9', 'H', { faceUp: true })
  ]
];

type TableStoryArgs = {
  playerCount: number;
  handCardSize?: CardRowSize;
  seatCardSize?: CardRowSize;
  communityCardSize?: CardRowSize;
};

const meta: Meta<typeof GameTable, TableStoryArgs> = {
  title: 'Table/GameTable',
  component: GameTable,
  tags: ['autodocs'],
  args: {
    playerCount: 8,
    sceneWidth: '80%',
    sceneHeight: '520px',
    sceneAlign: 'center',
    handCardRows: sampleHandRows,
    handCardAngle: -10,
    handCardCurveVerticalOffset: 16,
    handCardOverlap: '55%',
    handCardRowGap: 12,
    handCardRowOverlap: 20,
    handCardSize: 'md',
    seatCardSize: 'md',
    communityCardSize: 'md',
    avatarRingScale: 1.08,
    cardRingScale: 0.66
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
    handCardRows: sampleHandRows
  },
  render: ({ playerCount, ...storyArgs }) => (
    <GameTable players={playerStubs.slice(0, playerCount)} {...storyArgs} />
  )
};
