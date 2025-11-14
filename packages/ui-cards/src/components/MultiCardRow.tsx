'use client';

import clsx from 'clsx';
import type { CSSProperties } from 'react';

import type { Card } from '@poker/core-cards';
import { CardRow } from './CardRow';
import type { CardRowProps } from './cardRow.types';

export interface MultiCardRowProps extends Omit<CardRowProps, 'cards'> {
  rows: Card[][];
  /**
   * Positive gap between row wrappers.
   */
  rowGap?: number;
  /**
   * Amount of vertical overlap to apply between consecutive rows. Values turn into negative
   * margin-top so that rows visually overlap the previous one.
   */
  rowOverlap?: number;
  /** Optional class added to each `CardRow`. */
  rowClassName?: string;
  /** Custom CSS for the outer container. */
  style?: CSSProperties;
}

export function MultiCardRow({
  rows,
  rowGap = 24,
  rowOverlap = 8,
  rowClassName,
  className,
  style,
  ...rowProps
}: MultiCardRowProps) {
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: rowGap,
    ...style
  };

  return (
    <div className={clsx('v-multi-card-row', className)} style={containerStyle}>
      {rows.map((cards, rowIndex) => (
        <div
          key={`multi-row-${rowIndex}`}
          style={{
            marginTop: rowIndex === 0 ? 0 : -rowOverlap,
            position: 'relative',
            zIndex: rowIndex
          }}
        >
          <CardRow {...rowProps} cards={cards} className={rowClassName} />
        </div>
      ))}
    </div>
  );
}
