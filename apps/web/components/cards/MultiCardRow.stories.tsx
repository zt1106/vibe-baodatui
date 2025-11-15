import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useMemo, useState } from 'react';

import type { Card } from '@poker/core-cards';
import { CardAnimationProvider, CardRow, MultiCardRow, type CardAnimationOptions } from '@poker/ui-cards';
import { createSampleHand, createSampleRows } from './sampleData';

const baseRows = createSampleRows({ rows: 3, cardsPerRow: 6, seed: 2 });
const variedRows = [
  createSampleHand(7, 8),
  createSampleHand(8, 5),
  createSampleHand(9, 3)
];
const defaultSelectedIds = [
  baseRows[0]?.[0]?.id,
  baseRows[1]?.[1]?.id
].filter(Boolean).map(id => String(id)) as string[];

const meta: Meta<typeof MultiCardRow> = {
  title: 'Cards/MultiCardRow',
  component: MultiCardRow,
  args: {
    rows: baseRows,
    rowOverlap: 50,
    rowGap: 0,
    overlap: '60%',
    size: 'md',
    selectionMode: 'multiple',
    angle: -18,
    curveVerticalOffset: 20
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
    curveVerticalOffset: {
      control: { type: 'number' },
      defaultValue: 12
    },
    selectionMode: {
      control: { type: 'radio' },
      options: ['none', 'single', 'multiple']
    },
    rowOverlap: {
      control: { type: 'number' }
    },
    rowGap: {
      control: { type: 'number' }
    }
  },
  tags: ['autodocs']
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SelectableRows: Story = {
  args: {
    selectionMode: 'multiple',
    defaultSelectedIds
  }
};

export const VaryingCounts: Story = {
  args: {
    rows: variedRows,
    selectionMode: 'multiple'
  }
};

export const TransferToSingleRow: Story = {
  render: function TransferToSingleRowStory() {
    const initialSetup = useMemo(() => {
      const rowCount = 3;
      const cardsPerRow = 5;
      const deck = createSampleHand(2, rowCount * cardsPerRow);
      const rows: Card[][] = [];
      for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
        const start = rowIndex * cardsPerRow;
        rows.push(deck.slice(start, start + cardsPerRow));
      }
      return {
        multiRows: rows,
        singleRow: []
      };
    }, []);

    const [multiRows, setMultiRows] = useState(initialSetup.multiRows);
    const [singleRow, setSingleRow] = useState(initialSetup.singleRow);

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

    const totalMultiCards = multiRows.reduce((sum, row) => sum + row.length, 0);

    const moveFromMultiToSingle = useCallback((count: number) => {
      let moved: Card[] = [];
      setMultiRows(prevRows => {
        const rowsCopy = prevRows.map(row => [...row]);
        let remaining = count;
        for (let idx = rowsCopy.length - 1; idx >= 0 && remaining > 0; idx -= 1) {
          while (rowsCopy[idx].length > 0 && remaining > 0) {
            const card = rowsCopy[idx].pop()!;
            moved.unshift(card);
            remaining -= 1;
          }
        }
        if (moved.length === 0) {
          return prevRows;
        }
        return rowsCopy;
      });
      if (moved.length > 0) {
        setSingleRow(prev => [...prev, ...moved]);
      }
    }, []);

    const insertIntoRandomRow = useCallback((moving: Card[]) => {
      if (moving.length === 0) {
        return;
      }
      setMultiRows(prevRows => {
        const rowsCopy = prevRows.map(row => [...row]);
        const rowIndex = Math.floor(Math.random() * rowsCopy.length);
        const targetRow = rowsCopy[rowIndex];
        const insertIndex = Math.floor(Math.random() * (targetRow.length + 1));
        rowsCopy[rowIndex] = [
          ...targetRow.slice(0, insertIndex),
          ...moving,
          ...targetRow.slice(insertIndex)
        ];
        return rowsCopy;
      });
    }, []);

    const moveFromSingleToMulti = useCallback(
      (count: number) => {
        let moved: Card[] = [];
        setSingleRow(prev => {
          if (prev.length === 0) {
            return prev;
          }
          const moveCount = Math.min(count, prev.length);
          moved = prev.slice(prev.length - moveCount);
          return prev.slice(0, prev.length - moveCount);
        });
        if (moved.length === 0) {
          return;
        }
        insertIntoRandomRow(moved);
      },
      [insertIntoRandomRow]
    );

    return (
      <CardAnimationProvider layoutGroupId="storybook-multi-card-to-single-transfer">
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
          <h3 style={{ margin: 0 }}>Move cards between stacked and single rows</h3>
          <p style={{ margin: 0, color: '#94a3b8' }}>
            Transfer cards from the stacked layout into the single row (and back) to see how shared layout
            animations follow each card during the switch.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => moveFromMultiToSingle(1)} disabled={totalMultiCards === 0}>
              Move one → single row
            </button>
            <button type="button" onClick={() => moveFromMultiToSingle(2)} disabled={totalMultiCards < 2}>
              Move two → single row
            </button>
            <button type="button" onClick={() => moveFromSingleToMulti(1)} disabled={singleRow.length === 0}>
              Move one → random row
            </button>
            <button type="button" onClick={() => moveFromSingleToMulti(2)} disabled={singleRow.length < 2}>
              Move two → random row
            </button>
          </div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 260 }}>
              <p style={{ margin: '0 0 8px', color: '#94a3b8' }}>Multi row</p>
              <MultiCardRow
                rows={multiRows}
                size="md"
                overlap="60%"
                angle={-18}
                curveVerticalOffset={20}
                rowGap={12}
                rowOverlap={20}
                selectionMode="none"
                animation={slowStableAnimation}
              />
            </div>
            <div style={{ minWidth: 260 }}>
              <p style={{ margin: '0 0 8px', color: '#94a3b8' }}>Single row</p>
              <CardRow
                cards={singleRow}
                size="md"
                overlap="60%"
                angle={0}
                curveVerticalOffset={20}
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
