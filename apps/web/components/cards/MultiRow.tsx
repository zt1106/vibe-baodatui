'use client';

import type { Card, CardSize } from '@poker/core-cards';
import { CardRow, type CardRowProps } from '@poker/ui-cards';

export interface MultiRowProps {
  rows: Card[][];
  size?: CardSize;
  overlap?: number;
  rowGap?: number;
  align?: CardRowProps['align'];
  orientation?: CardRowProps['orientation'];
  alternateOrientation?: boolean;
  selectMode?: CardRowProps['selectMode'];
  layoutIdPrefix?: string;
}

export function MultiRow({
  rows,
  size = 'md',
  overlap = 0.35,
  rowGap = 32,
  align = 'center',
  orientation = 'bottom',
  alternateOrientation = false,
  selectMode = 'none',
  layoutIdPrefix = 'multi-row'
}: MultiRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: rowGap,
        width: '100%'
      }}
    >
      {rows.map((cards, index) => (
        <CardRow
          key={`${layoutIdPrefix}-${index}`}
          cards={cards}
          size={size}
          overlap={overlap}
          align={align}
          orientation={alternateOrientation && index % 2 === 1 ? 'top' : orientation}
          layoutIdPrefix={`${layoutIdPrefix}-${index}`}
          selectMode={selectMode}
        />
      ))}
    </div>
  );
}
