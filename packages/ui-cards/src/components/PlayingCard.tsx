'use client';

import clsx from 'clsx';
import {
  type CSSProperties,
  type DragEvent,
  type HTMLAttributes,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  forwardRef,
  useMemo,
  useRef
} from 'react';

import type { Card, CardSize } from '@poker/core-cards';
import { resolveCardCssVars } from '@poker/core-cards';

import { CardBack, type CardBackVariant } from './CardBack';
import { CardFace, type CardFaceVariant } from './CardFace';

type CardStyleProperties = CSSProperties & {
  [customVar: `--${string}`]: string | undefined;
};

export interface PlayingCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  card: Card;
  size?: CardSize;
  faceVariant?: CardFaceVariant;
  backVariant?: CardBackVariant;
  customBackImageUrl?: string;
  selected?: boolean;
  highlighted?: boolean;
  disabled?: boolean;
  tiltDeg?: number;
  elevation?: 0 | 1 | 2 | 3;
  draggable?: boolean;
  dragData?: unknown;
  onLongPress?: () => void;
  renderOverlay?: ReactNode;
  contentScale?: number;
  contentOffsetX?: number;
  contentOffsetY?: number;
  cornerRadius?: number;
  enableFlip?: boolean;
}

const ELEVATION_SHADOW: Record<NonNullable<PlayingCardProps['elevation']>, string> = {
  0: 'none',
  1: '0 10px 25px rgba(15, 23, 42, 0.28)',
  2: '0 16px 40px rgba(15, 23, 42, 0.35)',
  3: '0 28px 70px rgba(15, 23, 42, 0.45)'
};

export const PlayingCard = forwardRef<HTMLDivElement, PlayingCardProps>(function PlayingCard(
  {
    card,
    size = 'md',
    faceVariant = 'classic',
    backVariant = 'red',
    customBackImageUrl,
    selected,
    highlighted,
    disabled,
    tiltDeg,
    elevation = 1,
    draggable,
    dragData,
    onLongPress,
    renderOverlay,
    contentScale = 1.2,
    contentOffsetX = -0.5,
    contentOffsetY = -0.5,
    cornerRadius,
    enableFlip,
    className,
    style,
    onPointerDown,
    onPointerUp,
    onClick,
    ...rest
  }: PlayingCardProps,
  ref
) {
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
  const tiltTransform = tiltDeg ? `rotate(${tiltDeg}deg)` : undefined;
  const transformValue = [tiltTransform, inheritedTransform].filter(Boolean).join(' ') || undefined;
  const resolvedCornerRadius = cornerRadius ?? 6;
  const flipEnabled = Boolean(enableFlip);

  const combinedStyle: CardStyleProperties = {
    ...cssVars,
    '--v-card-face-corner-size': `${0.9 * contentScale}rem`,
    '--v-card-face-symbol-size': `${2.4 * contentScale}rem`,
    '--v-card-face-left-offset': `${contentOffsetX}rem`,
    '--v-card-face-top-offset': `${contentOffsetY}rem`,
    width: 'var(--card-w)',
    height: 'var(--card-h)',
    position: 'relative',
    borderRadius: resolvedCornerRadius,
    perspective: '1200px',
    boxShadow: baseShadow,
    transform: transformValue,
    opacity: disabled ? 0.6 : 1,
    cursor,
    filter: filterValue,
    transition: 'filter 0.15s ease, box-shadow 0.2s ease, transform 0.15s ease',
    ...(styleRest as CSSProperties),
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

  const staticContent = (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit'
      }}
    >
      {card.faceUp ? (
        <CardFace card={card} variant={faceVariant} />
      ) : (
        <CardBack variant={backVariant} customPatternUrl={customBackImageUrl} />
      )}
    </div>
  );
  const flipContent = (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        transformStyle: 'preserve-3d',
        transition: 'transform 460ms cubic-bezier(0.2, 0.8, 0.25, 1)',
        transform: `rotateY(${card.faceUp ? 0 : 180}deg)`
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          backfaceVisibility: 'hidden'
        }}
      >
        <CardFace card={card} variant={faceVariant} />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          transform: 'rotateY(180deg)',
          backfaceVisibility: 'hidden'
        }}
      >
        <CardBack variant={backVariant} customPatternUrl={customBackImageUrl} />
      </div>
    </div>
  );

  return (
    <div
      {...rest}
      ref={ref}
      data-card-id={String(card.id)}
      data-selected={selected ? 'true' : undefined}
      data-highlighted={highlighted ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
      draggable={draggable}
      className={clsx('v-playing-card', className)}
      style={combinedStyle}
      role={onClick ? 'button' : undefined}
      aria-pressed={selected ?? undefined}
      aria-disabled={disabled ?? undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={cancelLongPress}
      onClick={handleClick}
      onDragStartCapture={handleDragStart}
    >
      {flipEnabled ? flipContent : staticContent}
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
    </div>
  );
});

PlayingCard.displayName = 'PlayingCard';
