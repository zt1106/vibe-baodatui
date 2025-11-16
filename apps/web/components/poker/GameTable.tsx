'use client';

import { Fragment, type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';

import type { Card } from '@poker/core-cards';
import { CardRow } from '@poker/ui-cards';

import { PlayerAvatar } from './PlayerAvatar';

import styles from './GameTable.module.css';

export type GameTableSeat = {
  id: string;
  nickname: string;
  avatar: string;
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
};

type Dimensions = { width: number; height: number };

const TABLE_TILT_DEG = 24;
const MAX_TABLE_PLAYERS = 8;

export function GameTable({
  players,
  communityCards = [],
  dealerSeatId,
  sceneWidth,
  sceneHeight,
  sceneAlign
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
  const avatarSize = Math.round(Math.min(Math.max(measurementBasis * 0.12, 64), 104));
  const communityCardWidth = Math.round(Math.min(Math.max(measurementBasis * 0.14, 96), 150));

  const ellipsePadding = Math.max(Math.min(minDimension * 0.08, 120), 36);
  const ellipseRadiusX = Math.max((effectiveWidth - ellipsePadding) / 2, 0);
  const ellipseRadiusY = Math.max((effectiveHeight - ellipsePadding) / 2, 0);
  const avatarOffset = Math.max(Math.min(minDimension * 0.05, 72), 36);
  const cardInset = Math.max(Math.min(minDimension * 0.12, 120), 56);
  const avatarRadiusX = ellipseRadiusX + avatarOffset;
  const avatarRadiusY = ellipseRadiusY + avatarOffset;
  const cardRadiusX = Math.max(ellipseRadiusX - cardInset, 0);
  const cardRadiusY = Math.max(ellipseRadiusY - cardInset, 0);
  const dealerRadiusX = (avatarRadiusX + cardRadiusX) / 2;
  const dealerRadiusY = (avatarRadiusY + cardRadiusY) / 2;

  const visiblePlayers = useMemo(() => players.slice(0, MAX_TABLE_PLAYERS), [players]);

  const seatPositions = useMemo(() => {
    if (visiblePlayers.length === 0) {
      return [];
    }
    const centerX = effectiveWidth / 2;
    const centerY = effectiveHeight / 2;
    const step = (Math.PI * 2) / visiblePlayers.length;
    const rotationOffset = visiblePlayers.length % 2 === 1 ? step / 2 : 0;
    const startAngle = -Math.PI / 2 + rotationOffset; // place first player at the top edge
    return visiblePlayers.map((player, index) => {
      const angle = startAngle + index * step;
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      return {
        player,
        angle,
        avatar: {
          x: centerX + cosAngle * avatarRadiusX,
          y: centerY + sinAngle * avatarRadiusY
        },
        cards: {
          x: centerX + cosAngle * cardRadiusX,
          y: centerY + sinAngle * cardRadiusY
        },
        dealer: {
          x: centerX + cosAngle * dealerRadiusX,
          y: centerY + sinAngle * dealerRadiusY
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
    visiblePlayers
  ]);

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

  return (
    <section className={styles.tableStage} data-testid="game-table-stage">
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
                size="md"
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
          {seatPositions.map(seat => (
            <Fragment key={seat.player.id}>
              <div
                className={styles.cardArea}
                style={{
                  left: `${seat.cards.x}px`,
                  top: `${seat.cards.y}px`
                }}
              >
                {seat.player.cards && seat.player.cards.length > 0 ? (
                  <CardRow
                    cards={seat.player.cards}
                    size="md"
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
                <PlayerAvatar
                  playerName={seat.player.nickname}
                  avatarUrl={`/avatars/${seat.player.avatar}`}
                  status={seat.player.status}
                  size={avatarSize}
                  score={seat.player.stack}
                  scoreLabel="筹码"
                  className={styles.tableAvatar}
                />
              </div>
              {dealerSeatId === seat.player.id && (
                <div
                  className={styles.dealerButton}
                  style={{
                    left: `${seat.dealer.x}px`,
                    top: `${seat.dealer.y}px`
                  }}
                  aria-label="庄家按钮"
                >
                  D
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
