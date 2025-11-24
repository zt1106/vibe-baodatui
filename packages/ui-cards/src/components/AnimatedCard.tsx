'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

import { useCardAnimation } from './CardAnimationProvider';
import { CARD_DEFAULT_SPRING } from './cardAnimation.shared';
import { PlayingCard, type PlayingCardProps } from './PlayingCard';

const MotionPlayingCard = motion.create(PlayingCard);

const DEFAULT_INITIAL = { opacity: 0, scale: 0.95 };
const DEFAULT_ANIMATE = { opacity: 1, scale: 1 };
const DEFAULT_EXIT = { opacity: 0, scale: 0.85 };

export type AnimatedCardProps = PlayingCardProps & HTMLMotionProps<'button'>;

export function AnimatedCard({
  layout,
  layoutId,
  transition,
  initial,
  animate,
  exit,
  ...rest
}: AnimatedCardProps) {
  const { transition: contextTransition } = useCardAnimation();
  const shouldProvideDefaults = !layoutId;
  const resolvedLayout = layout ?? Boolean(layoutId);
  const resolvedInitial = initial ?? (shouldProvideDefaults ? DEFAULT_INITIAL : false);
  const resolvedAnimate = animate ?? (shouldProvideDefaults ? DEFAULT_ANIMATE : undefined);
  const resolvedExit = exit ?? (shouldProvideDefaults ? DEFAULT_EXIT : undefined);
  return (
    <MotionPlayingCard
      layout={resolvedLayout}
      layoutId={layoutId}
      transition={transition ?? contextTransition ?? CARD_DEFAULT_SPRING}
      initial={resolvedInitial}
      animate={resolvedAnimate}
      exit={resolvedExit}
      {...rest}
    />
  );
}
