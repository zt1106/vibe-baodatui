import type { Card, CardSize } from '@poker/core-cards';
import type { CSSProperties, HTMLAttributes } from 'react';

export type CardRowSize = CardSize | { width: number; height?: number };
export type CardRowOverlap = number | `${number}%`;
export type CardRowSelectionMode = 'none' | 'single' | 'multiple';

export interface CardRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  cards: Card[];
  size?: CardRowSize;
  overlap?: CardRowOverlap;
  angle?: number;
  curveVerticalOffset?: number;
  selectionMode?: CardRowSelectionMode;
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  disabledIds?: string[];
  onCardClick?: (card: Card) => void;
}
