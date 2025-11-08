'use client';

import clsx from 'clsx';
import { motion, type HTMLMotionProps, type MotionStyle } from 'framer-motion';
import {
  type DragEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useMemo,
  useRef
} from 'react';

import type { Card, CardSize } from '@poker/core-cards';
import { resolveCardCssVars } from '@poker/core-cards';

import '../styles/card.css';

import { flipVariants } from '../motionVariants';
import { CardBack, type CardBackVariant } from './CardBack';
import { CardFace, type CardFaceVariant } from './CardFace';

export interface PlayingCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  card: Card;
  size?: CardSize;
  faceVariant?: CardFaceVariant;
  backVariant?: CardBackVariant;
  customBackImageUrl?: string;
  selected?: boolean;
  highlighted?: boolean;
  disabled?: boolean;
  tiltDeg?: number;
  layoutId?: string;
  elevation?: 0 | 1 | 2 | 3;
  draggable?: boolean;
  dragData?: unknown;
  onLongPress?: () => void;
  renderOverlay?: ReactNode;
  theme?: 'classic' | 'minimal' | 'neon';
  shadowStrength?: 'soft' | 'base' | 'deep';
  borderStyle?: 'double' | 'single' | 'minimal';
  noiseOpacity?: number;
}

const ELEVATION_SHADOW: Record<NonNullable<PlayingCardProps['elevation']>, string> = {
  0: '0 0 0 rgba(0, 0, 0, 0)',
  1: '0 10px 24px rgba(15, 23, 42, 0.28)',
  2: '0 16px 36px rgba(15, 23, 42, 0.35)',
  3: '0 26px 64px rgba(15, 23, 42, 0.45)'
};

export function PlayingCard({
  card,
  size = 'md',
  faceVariant,
  backVariant = 'red',
  customBackImageUrl,
  selected,
  highlighted,
  disabled,
  tiltDeg,
  layoutId,
  elevation = 1,
  draggable,
  dragData,
  onLongPress,
  renderOverlay,
  className,
  style,
  onPointerDown,
  onPointerUp,
  onClick,
  theme = 'classic',
  shadowStrength = 'base',
  borderStyle = 'double',
  noiseOpacity = 0.18,
  ...rest
}: PlayingCardProps) {
  const longPressTimer = useRef<number | null>(null);
  const cssVars = useMemo(() => resolveCardCssVars(size), [size]);
  const { transform: inheritedTransform, ...styleRest } = style ?? {};
  const cursor = disabled ? 'not-allowed' : draggable ? 'grab' : onClick ? 'pointer' : 'default';
  const normalizedNoise = Math.min(Math.max(noiseOpacity, 0), 0.5);
  const faceState = card.faceUp ? 'front' : 'back';
  const resolvedFaceVariant = (faceVariant ?? theme) as CardFaceVariant;

  const combinedStyle: MotionStyle = {
    ...cssVars,
    width: 'var(--card-w)',
    height: 'var(--card-h)',
    position: 'relative',
    borderRadius: 'var(--card-radius)',
    perspective: '1400px',
    boxShadow: ELEVATION_SHADOW[elevation],
    transform: tiltDeg ? `${inheritedTransform ?? ''} rotate(${tiltDeg}deg)`.trim() || undefined : inheritedTransform,
    opacity: disabled ? 0.6 : 1,
    cursor,
    transition: 'box-shadow 0.2s ease',
    '--card-shadow-current': ELEVATION_SHADOW[elevation],
    '--card-noise-opacity': `${normalizedNoise}`,
    ...(styleRest as MotionStyle),
    transformOrigin: 'center center'
  };

  const cancelLongPress = () => {
    if (longPressTimer.current != null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    if (onLongPress) {
      cancelLongPress();
      longPressTimer.current = window.setTimeout(() => {
        longPressTimer.current = null;
        onLongPress();
      }, 450);
    }
    onPointerDown?.(event);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    cancelLongPress();
    onPointerUp?.(event);
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    if (!draggable) return;
    if (dragData !== undefined) {
      try {
        event.dataTransfer?.setData('application/json', JSON.stringify(dragData));
      } catch {
        // Non-serializable data, ignore.
      }
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <motion.div
      {...rest}
      data-card-id={card.id}
      data-selected={selected ? 'true' : undefined}
      data-highlighted={highlighted ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
      data-face={faceState}
      layout
      layoutId={layoutId ?? card.id}
      draggable={draggable}
      className={clsx(
        'v-playing-card',
        `card--${size}`,
        `card-theme-${theme}`,
        shadowStrength ? `card-shadow-${shadowStrength}` : undefined,
        borderStyle !== 'double' ? `card-border-${borderStyle}` : undefined,
        className
      )}
      style={combinedStyle as MotionStyle}
      role={onClick ? 'button' : undefined}
      aria-pressed={selected ?? undefined}
      aria-disabled={disabled ?? undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={cancelLongPress}
      onClick={handleClick}
      onDragStartCapture={handleDragStart}
      whileHover={disabled ? undefined : { y: -4, rotateX: 1, rotateY: 0.5 }}
      whileTap={disabled ? undefined : { y: 0, scale: 0.99 }}
    >
      <div className="card__frame">
        <motion.div className="v-card-3d" variants={flipVariants} animate={card.faceUp ? 'face' : 'back'}>
          <div className={clsx('card__face', 'card__face--front')}>
            {card.faceUp && <CardFace card={card} variant={resolvedFaceVariant} />}
          </div>
          <div className={clsx('card__face', 'card__face--back')}>
            <CardBack variant={backVariant} customPatternUrl={customBackImageUrl} />
          </div>
        </motion.div>
      </div>
      {renderOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none'
          }}
        >
          {renderOverlay}
        </div>
      )}
    </motion.div>
  );
}
