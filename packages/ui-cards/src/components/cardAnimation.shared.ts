import type { Transition } from 'framer-motion';

export interface CardAnimationOptions {
  disabled?: boolean;
  transition?: Transition;
  entryYOffset?: number;
}

export const CARD_DEFAULT_SPRING: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 34,
  mass: 0.75
};
