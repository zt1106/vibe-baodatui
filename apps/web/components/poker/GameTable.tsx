'use client';

import { Fragment, type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';

import type { Card } from '@poker/core-cards';
import { CardRow, MultiCardRow } from '@poker/ui-cards';
import type { CardRowOverlap, CardRowSize } from '@poker/ui-cards';

import { PlayerAvatar } from './PlayerAvatar';
import { PLAYER_AVATAR_SIZE } from './playerAvatarDefaults';

import styles from './GameTable.module.css';

export type GameTableSeat = {
  id: string;
  nickname: string;
  avatar: string;
  avatarUrl?: string;
  status?: string;
  stack?: number;
  cards?: Card[];
};

export type GameTableProps = {
  players: GameTableSeat[];
  communityCards?: Card[];
  dealerSeatId?: string;
  sceneWidth?: string;
  sceneHeight?: string;
  sceneAlign?: 'flex-start' | 'center' | 'flex-end';
  handCardRows?: Card[][];
  handCardRowGap?: number;
  handCardRowOverlap?: number;
  handCardOverlap?: CardRowOverlap;
  handCardAngle?: number;
  handCardCurveVerticalOffset?: number;
  handCardSize?: CardRowSize;
  avatarRingScale?: number;
  cardRingScale?: number;
  communityCardSize?: CardRowSize;
  seatCardSize?: CardRowSize;
  handSectionOverlap?: number;
};

type Dimensions = { width: number; height: number };

const TABLE_TILT_DEG = 24;
const MAX_TABLE_PLAYERS = 8;
const MAX_PLAYER_NAME_CHARS = 8;

function formatPlayerName(name: string, maxLength = MAX_PLAYER_NAME_CHARS) {
  const trimmed = name.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  const sliceLength = Math.max(1, maxLength - 2);
  return `${trimmed.slice(0, sliceLength)}..`;
}

export function GameTable({
  players,
  communityCards = [],
  dealerSeatId,
  sceneWidth,
  sceneHeight,
  sceneAlign,
  handCardRows = [],
  handCardRowGap = 12,
  handCardRowOverlap = 24,
  handCardOverlap = '60%',
  handCardAngle = -12,
  handCardCurveVerticalOffset = 18,
  handCardSize = 'md',
  avatarRingScale = 1.08,
  cardRingScale = 0.66,
  communityCardSize = 'md',
  seatCardSize = 'sm',
  handSectionOverlap = 32
}: GameTableProps) {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });

  useEffect(() => {
    const element = tableRef.current;
    if (!element) return;

    const setFromRect = (rect: Pick<DOMRectReadOnly, 'width' | 'height'>) => {
      const { width, height } = rect;
      setDimensions(prev => (prev.width === width && prev.height === height ? prev : { width, height }));
    };

    const measure = () => {
      const rect = element.getBoundingClientRect();
      setFromRect(rect);
    };

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(entries => {
        const entry = entries[0];
        if (!entry) return;
        setFromRect(entry.contentRect);
      });
      observer.observe(element);
      return () => observer.disconnect();
    }

    measure();
    const handleResize = () => {
      measure();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const fallbackSize = 520;
  const effectiveWidth = dimensions.width || fallbackSize;
  const effectiveHeight = dimensions.height || fallbackSize;
  const minDimension = Math.min(effectiveWidth, effectiveHeight);
  const measurementBasis = minDimension > 0 ? minDimension : fallbackSize;
  const centerX = effectiveWidth / 2;
  const centerY = effectiveHeight / 2;
  const avatarSize = PLAYER_AVATAR_SIZE;
  const communityCardWidth = Math.round(Math.min(Math.max(measurementBasis * 0.14, 96), 150));
  const avatarEdgeMargin = avatarSize / 2 + 18;
  const cardEdgeMargin = Math.max(avatarEdgeMargin - 8, 40);

  const ellipsePaddingX = Math.max(Math.min(effectiveWidth * 0.08, 120), 36);
  const ellipsePaddingY = Math.max(Math.min(effectiveHeight * 0.08, 120), 36);
  const ellipseBaseX = Math.max((effectiveWidth - ellipsePaddingX) / 2, 0);
  const ellipseBaseY = Math.max((effectiveHeight - ellipsePaddingY) / 2, 0);
  const outerEllipseScale = 1.05;
  const ellipseRadiusX = ellipseBaseX * outerEllipseScale;
  const ellipseRadiusY = ellipseBaseY * outerEllipseScale;
  const maxAvatarRadiusX = Math.max(centerX - avatarEdgeMargin, 0);
  const maxAvatarRadiusY = Math.max(centerY - avatarEdgeMargin, 0);
  const maxCardRadiusX = Math.max(centerX - cardEdgeMargin, 0);
  const maxCardRadiusY = Math.max(centerY - cardEdgeMargin, 0);
  const avatarRadiusX = Math.min(ellipseRadiusX * avatarRingScale, maxAvatarRadiusX);
  const avatarRadiusY = Math.min(ellipseRadiusY * avatarRingScale, maxAvatarRadiusY);
  const cardRadiusX = Math.min(ellipseRadiusX * cardRingScale, maxCardRadiusX);
  const cardRadiusY = Math.min(ellipseRadiusY * cardRingScale, maxCardRadiusY);
  const dealerRadiusX = (avatarRadiusX + cardRadiusX) / 2;
  const dealerRadiusY = (avatarRadiusY + cardRadiusY) / 2;

  const visiblePlayers = useMemo(() => players.slice(0, MAX_TABLE_PLAYERS), [players]);

  const seatPositions = useMemo(() => {
    if (visiblePlayers.length === 0) {
      return [];
    }
    const step = (Math.PI * 2) / visiblePlayers.length;
    const rotationOffset = visiblePlayers.length % 2 === 1 ? step / 2 : 0;
    const startAngle = -Math.PI / 2 + rotationOffset; // place first player at the top edge
    return visiblePlayers.map((player, index) => {
      const angle = startAngle + index * step;
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      const shapedSin = Math.sign(sinAngle) * Math.pow(Math.abs(sinAngle), 0.65);
      return {
        player,
        angle,
        avatar: {
          x: centerX + cosAngle * avatarRadiusX,
          y: centerY + shapedSin * avatarRadiusY
        },
        cards: {
          x: centerX + cosAngle * cardRadiusX,
          y: centerY + shapedSin * cardRadiusY
        },
        dealer: {
          x: centerX + cosAngle * dealerRadiusX,
          y: centerY + shapedSin * dealerRadiusY
        }
      };
    });
  }, [
    avatarRadiusX,
    avatarRadiusY,
    cardRadiusX,
    cardRadiusY,
    dealerRadiusX,
    dealerRadiusY,
    effectiveHeight,
    effectiveWidth,
    centerX,
    centerY,
    visiblePlayers
  ]);

  const suppressedSeatId = useMemo(() => {
    if (seatPositions.length === 0) {
      return null;
    }
    let bottomSeat = seatPositions[0];
    for (const seat of seatPositions) {
      if (seat.avatar.y > bottomSeat.avatar.y) {
        bottomSeat = seat;
      }
    }
    return bottomSeat.player.id;
  }, [seatPositions]);

  const tableStyle = useMemo(
    () => ({ '--table-tilt-deg': `${TABLE_TILT_DEG}deg` } as CSSProperties),
    []
  );

  const resolvedSceneHeight = sceneHeight ?? 'min(80vh, 640px)';
  const sceneStyle = useMemo(
    () => ({
      width: sceneWidth ?? 'min(92vw, 1040px)',
      height: resolvedSceneHeight,
      justifyContent:
        sceneAlign === 'flex-start'
          ? 'flex-start'
          : sceneAlign === 'flex-end'
          ? 'flex-end'
          : 'center',
      alignItems: 'center'
    }),
    [resolvedSceneHeight, sceneAlign, sceneWidth]
  );
  const showHandCardSection = handCardRows.length > 0;

  return (
    <section className={styles.tableStage} data-testid="game-table-stage">
      <div className={styles.tableBody}>
        <div className={styles.tableScene} style={sceneStyle}>
          <div ref={tableRef} className={styles.tableRing} style={tableStyle}>
            <div className={styles.tableSurface} aria-hidden="true">
              <div className={styles.tableInset} />
            </div>
            <div className={styles.centerGlow} aria-hidden="true" />
            <div className={styles.communityRow}>
              {communityCards.length > 0 ? (
                <CardRow
                  cards={communityCards}
                  size={communityCardSize}
                  overlap="65%"
                  angle={0}
                  curveVerticalOffset={18}
                  selectionMode="none"
                />
              ) : (
                <span className={styles.communityPlaceholder}>等待发公共牌…</span>
              )}
            </div>
            {seatPositions.length === 0 && (
              <div className={styles.emptyState}>等待玩家坐下…</div>
            )}
            {seatPositions.map(seat => {
              const hasCards = Boolean(seat.player.cards && seat.player.cards.length > 0);
              const cardAreaClass = hasCards
                ? `${styles.cardArea} ${styles.cardAreaActive}`
                : styles.cardArea;
              return (
                <Fragment key={seat.player.id}>
                  <div
                    className={cardAreaClass}
                    style={{
                      left: `${seat.cards.x}px`,
                      top: `${seat.cards.y}px`
                    }}
                  >
                    {hasCards ? (
                      <CardRow
                        cards={seat.player.cards}
                        size={seatCardSize}
                        overlap="65%"
                        angle={0}
                        curveVerticalOffset={18}
                        selectionMode="none"
                      />
                    ) : (
                      <span className={styles.cardPlaceholder}>未发牌</span>
                    )}
                  </div>
                  <div
                    className={styles.avatarWrapper}
                    style={{
                      left: `${seat.avatar.x}px`,
                      top: `${seat.avatar.y}px`
                    }}
                  >
                    {seat.player.id !== suppressedSeatId && (
                      <PlayerAvatar
                        playerName={seat.player.nickname}
                        displayName={formatPlayerName(seat.player.nickname)}
                        avatarUrl={seat.player.avatarUrl ?? `/avatars/${seat.player.avatar}`}
                        size={avatarSize}
                        className={styles.tableAvatar}
                      />
                    )}
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>
      {showHandCardSection && (
        <div
          className={styles.handSection}
          style={{ '--hand-overlap': `${handSectionOverlap}px` } as CSSProperties}
        >
          <div className={styles.handSectionInner}>
            <MultiCardRow
              rows={handCardRows}
              rowGap={handCardRowGap}
              rowOverlap={handCardRowOverlap}
              overlap={handCardOverlap}
              angle={handCardAngle}
              curveVerticalOffset={handCardCurveVerticalOffset}
              size={handCardSize}
              selectionMode="none"
            />
          </div>
        </div>
      )}
    </section>
  );
}
