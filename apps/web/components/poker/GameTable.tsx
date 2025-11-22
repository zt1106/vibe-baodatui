'use client';

import {
  Fragment,
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import type { Card, CardId } from '@poker/core-cards';
import { CardRow, MultiCardRow } from '@poker/ui-cards';
import type { CardRowOverlap, CardRowSize } from '@poker/ui-cards';
import { AnimatePresence, motion } from 'framer-motion';

import { PlayerAvatar } from './PlayerAvatar';
import { PLAYER_AVATAR_SIZE } from './playerAvatarDefaults';
import { SingleCard } from '../cards/SingleCard';

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
  topBarActions?: ReactNode;
  dealingCards?: DealingCardFlight[];
  dealingOrigin?: { x?: number; y?: number };
  onDealingCardComplete?: (flightId: string) => void;
};

type Dimensions = { width: number; height: number };

const TABLE_TILT_DEG = 24;
const MAX_TABLE_PLAYERS = 8;
const MAX_PLAYER_NAME_CHARS = 8;

export type DealingCardFlight = {
  id: string;
  seatId: string;
  cardId: CardId;
  faceUp?: boolean;
};

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
  handSectionOverlap = 32,
  topBarActions,
  dealingCards,
  dealingOrigin,
  onDealingCardComplete
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

  const seatLookup = useMemo(
    () => new Map(seatPositions.map(seat => [seat.player.id, seat])),
    [seatPositions]
  );

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
      alignItems: 'flex-start'
    }),
    [resolvedSceneHeight, sceneAlign, sceneWidth]
  );
  const showHandCardSection = handCardRows.length > 0;
  const dealingOriginPoint = useMemo(
    () => ({
      x: dealingOrigin?.x ?? centerX,
      y: dealingOrigin?.y ?? centerY
    }),
    [centerX, centerY, dealingOrigin?.x, dealingOrigin?.y]
  );
  const activeDealingCards = useMemo(() => {
    if (!dealingCards || dealingCards.length === 0) {
      return [];
    }
    return dealingCards
      .map(flight => {
        const targetSeat = seatLookup.get(flight.seatId);
        if (!targetSeat || targetSeat.player.id === suppressedSeatId) {
          return null;
        }
        const towardAvatarWeight = 0.7;
        const targetX =
          targetSeat.avatar.x * towardAvatarWeight + targetSeat.cards.x * (1 - towardAvatarWeight);
        const targetY =
          targetSeat.avatar.y * towardAvatarWeight + targetSeat.cards.y * (1 - towardAvatarWeight);
        return {
          ...flight,
          target: {
            x: targetX,
            y: targetY
          }
        };
      })
      .filter(Boolean) as Array<DealingCardFlight & { target: { x: number; y: number } }>;
  }, [dealingCards, seatLookup, suppressedSeatId]);

  return (
    <section className={styles.tableStage} data-testid="game-table-stage">
      <div className={styles.tableBody}>
        <div className={styles.tableScene} style={sceneStyle}>
          <div className={styles.topBar} aria-live="polite">
            <span className={styles.topBarLeft}>示例牌局信息：小盲 25 / 大盲 50 · 经典模式</span>
            <div className={styles.topBarRight}>
              <span className={styles.topBarRightText}>底池 1,250</span>
              {topBarActions ? <div className={styles.topBarActions}>{topBarActions}</div> : null}
            </div>
          </div>
          <div ref={tableRef} className={styles.tableRing} style={tableStyle}>
            <div className={styles.tableSurface} aria-hidden="true">
              <div className={styles.tableInset} />
            </div>
            <div className={styles.centerGlow} aria-hidden="true" />
            <AnimatePresence>
              {activeDealingCards.map(flight => (
                <motion.div
                  key={flight.id}
                  initial={{ x: dealingOriginPoint.x, y: dealingOriginPoint.y, opacity: 0, scale: 0.92 }}
                  animate={{
                    x: flight.target.x,
                    y: flight.target.y,
                    opacity: [0, 1, 1, 0],
                    scale: [0.92, 1, 1, 0.9]
                  }}
                  transition={{
                    duration: 1.05,
                    times: [0, 0.18, 0.78, 1],
                    ease: ['easeOut', 'easeOut', 'easeInOut']
                  }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 4,
                    filter: 'drop-shadow(0 18px 28px rgba(0, 0, 0, 0.28))'
                  }}
                  onAnimationComplete={() => onDealingCardComplete?.(flight.id)}
                >
                  <SingleCard
                    cardId={flight.cardId}
                    size={seatCardSize}
                    faceUp={flight.faceUp ?? false}
                    elevation={3}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
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
            ) : null}
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
                    ) : null}
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
          style={
            {
              '--hand-overlap': `${handSectionOverlap}px`,
              marginTop: -handSectionOverlap,
              paddingTop: 16
            } as CSSProperties
          }
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
