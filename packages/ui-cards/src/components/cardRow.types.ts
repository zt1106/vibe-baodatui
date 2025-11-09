import type { Card, CardId, CardSize } from '@poker/core-cards';
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
  selectedIds?: CardId[];
  defaultSelectedIds?: CardId[];
  onSelectionChange?: (ids: CardId[]) => void;
  disabledIds?: CardId[];
  onCardClick?: (card: Card) => void;
}
