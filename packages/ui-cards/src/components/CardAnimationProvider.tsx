'use client';

import type { CardId } from '@poker/core-cards';
import { LayoutGroup, type Transition } from 'framer-motion';
import { createContext, type ReactNode, useContext, useId, useMemo } from 'react';

import { CARD_DEFAULT_SPRING } from './cardAnimation.shared';

interface CardAnimationContextValue {
  getLayoutId: (cardId: CardId | string) => string;
  transition: Transition;
  layoutEnabled: boolean;
}

const CardAnimationContext = createContext<CardAnimationContextValue>({
  getLayoutId: cardId => `card-${cardId}`,
  transition: CARD_DEFAULT_SPRING,
  layoutEnabled: true
});

export interface CardAnimationProviderProps {
  children: ReactNode;
  layoutGroupId?: string;
  layoutIdPrefix?: string;
  transition?: Transition;
  disableLayoutAnimations?: boolean;
}

export function CardAnimationProvider({
  children,
  layoutGroupId,
  layoutIdPrefix,
  transition,
  disableLayoutAnimations
}: CardAnimationProviderProps) {
  const reactId = useId().replace(/:/g, '');
  const resolvedGroupId = layoutGroupId ?? `card-anim-${reactId}`;
  const prefix = layoutIdPrefix ?? resolvedGroupId;
  const contextValue = useMemo<CardAnimationContextValue>(
    () => ({
      getLayoutId: cardId => `${prefix}-${cardId}`,
      transition: transition ?? CARD_DEFAULT_SPRING,
      layoutEnabled: !disableLayoutAnimations
    }),
    [disableLayoutAnimations, prefix, transition]
  );

  return (
    <CardAnimationContext.Provider value={contextValue}>
      {contextValue.layoutEnabled ? <LayoutGroup id={resolvedGroupId}>{children}</LayoutGroup> : children}
    </CardAnimationContext.Provider>
  );
}

export function useCardAnimation() {
  return useContext(CardAnimationContext);
}
