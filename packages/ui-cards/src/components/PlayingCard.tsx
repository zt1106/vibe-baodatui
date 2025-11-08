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
  contentScale?: number;
  contentOffsetX?: number;
  contentOffsetY?: number;
}

const ELEVATION_SHADOW: Record<NonNullable<PlayingCardProps['elevation']>, string> = {
  0: 'none',
  1: '0 10px 25px rgba(15, 23, 42, 0.28)',
  2: '0 16px 40px rgba(15, 23, 42, 0.35)',
  3: '0 28px 70px rgba(15, 23, 42, 0.45)'
};

export function PlayingCard({
  card,
  size = 'md',
  faceVariant = 'classic',
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
  contentScale = 1.2,
  contentOffsetX = -0.5,
  contentOffsetY = -0.5,
  className,
  style,
  onPointerDown,
  onPointerUp,
  onClick,
  ...rest
}: PlayingCardProps) {
  const longPressTimer = useRef<number | null>(null);
  const cssVars = useMemo(() => resolveCardCssVars(size), [size]);
  const { transform: inheritedTransform, filter: inheritedFilter, ...styleRest } = style ?? {};
  const cursor = disabled ? 'not-allowed' : draggable ? 'grab' : onClick ? 'pointer' : 'default';
  const baseShadow = ELEVATION_SHADOW[elevation];
  const highlightFrame = highlighted ? (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: '-4px',
        border: '2px solid rgba(56, 189, 248, 0.9)',
        borderRadius: 0,
        pointerEvents: 'none'
      }}
    />
  ) : null;
  const selectedFilter = 'invert(0.95) hue-rotate(180deg) saturate(1.1)';
  const filterValue = selected
    ? [selectedFilter, inheritedFilter].filter(Boolean).join(' ').trim() || undefined
    : inheritedFilter;

  const combinedStyle: MotionStyle = {
    ...cssVars,
    '--v-card-face-corner-size': `${0.9 * contentScale}rem`,
    '--v-card-face-symbol-size': `${2.4 * contentScale}rem`,
    '--v-card-face-left-offset': `${contentOffsetX}rem`,
    '--v-card-face-top-offset': `${contentOffsetY}rem`,
    width: 'var(--card-w)',
    height: 'var(--card-h)',
    position: 'relative',
    borderRadius: 18,
    perspective: '1200px',
    boxShadow: baseShadow,
    transform: tiltDeg ? `${inheritedTransform ?? ''} rotate(${tiltDeg}deg)`.trim() || undefined : inheritedTransform,
    opacity: disabled ? 0.6 : 1,
    cursor,
    filter: filterValue,
    transition: 'filter 0.15s ease, box-shadow 0.2s ease',
    ...(styleRest as MotionStyle),
    transformOrigin: 'center center'
  };
  const transformTemplate = (transform?: string, generatedTransform?: string) => {
    const fragments = [transform, generatedTransform].filter(Boolean);
    return fragments.length > 0 ? fragments.join(' ') : 'none';
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
      layout
      layoutId={layoutId ?? card.id}
      draggable={draggable}
      className={clsx('v-playing-card', className)}
      style={combinedStyle as MotionStyle}
      role={onClick ? 'button' : undefined}
      aria-pressed={selected ?? undefined}
      aria-disabled={disabled ?? undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={cancelLongPress}
      onClick={handleClick}
      onDragStartCapture={handleDragStart}
      whileHover={disabled ? undefined : { y: -4 }}
      transformTemplate={transformTemplate}
    >
      <motion.div
        className="v-card-3d"
        variants={flipVariants}
        animate={card.faceUp ? 'face' : 'back'}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          transformStyle: 'preserve-3d'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden'
          }}
        >
          <CardFace card={card} variant={faceVariant} />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden'
          }}
        >
          <CardBack variant={backVariant} customPatternUrl={customBackImageUrl} />
        </div>
      </motion.div>
      {highlightFrame}
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
