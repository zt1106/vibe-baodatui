'use client';

import type { Meta, StoryObj } from '@storybook/react';

import { makeCard } from '@poker/core-cards';

import { GameTable, type GameTableSeat } from './GameTable';
import { PLAYER_AVATAR_STORY_URL } from './playerAvatarDefaults';

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

const playerStubs = basePlayerStubs.map(player => ({
  ...player,
  avatarUrl: PLAYER_AVATAR_STORY_URL
}));

const flopToRiver = [
  makeCard('10', 'S', { faceUp: true }),
  makeCard('J', 'C', { faceUp: true }),
  makeCard('Q', 'C', { faceUp: true }),
  makeCard('2', 'S', { faceUp: true }),
  makeCard('3', 'H', { faceUp: true })
];

type TableStoryArgs = {
  playerCount: number;
};

const meta: Meta<typeof GameTable, TableStoryArgs> = {
  title: 'Table/GameTable',
  component: GameTable,
  tags: ['autodocs'],
  args: {
    playerCount: 8,
    sceneWidth: '80%',
    sceneHeight: '520px',
    sceneAlign: 'center'
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
    }
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const FullTable: Story = {
  args: {
    communityCards: flopToRiver,
    dealerSeatId: 'seat-3',
    sceneWidth: '80vw',
    sceneHeight: '80vh'
  },
  render: ({ playerCount, ...storyArgs }) => (
    <GameTable players={playerStubs.slice(0, playerCount)} {...storyArgs} />
  )
};
