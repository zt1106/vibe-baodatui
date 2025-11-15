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
  sceneAlign?: 'flex-start' | 'center' | 'flex-end';
};

type Dimensions = { width: number; height: number };

const TABLE_TILT_DEG = 24;

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius
  };
}

export function GameTable({
  players,
  communityCards = [],
  dealerSeatId,
  sceneWidth,
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

  const tableDiameter = Math.min(dimensions.width, dimensions.height);
  const measurementBasis = tableDiameter > 0 ? tableDiameter : 520;
  const innerRadius = tableDiameter / 2;
  const avatarSize = Math.round(Math.min(Math.max(measurementBasis * 0.12, 64), 104));
  const communityCardWidth = Math.round(Math.min(Math.max(measurementBasis * 0.14, 96), 150));

  const seatPositions = useMemo(() => {
    if (!innerRadius || players.length === 0) {
      return [];
    }
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const step = (Math.PI * 2) / players.length;
    const startAngle = -Math.PI / 2; // place first player at the top edge
    const avatarRadius = innerRadius + Math.min(innerRadius * 0.22, 110);
    const cardRadius = innerRadius - Math.min(innerRadius * 0.25, 90);
    const dealerRadius = (avatarRadius + cardRadius) / 2;
    return players.map((player, index) => {
      const angle = startAngle + index * step;
      return {
        player,
        angle,
        avatar: polarToCartesian(centerX, centerY, avatarRadius, angle),
        cards: polarToCartesian(centerX, centerY, cardRadius, angle),
        dealer: polarToCartesian(centerX, centerY, dealerRadius, angle)
      };
    });
  }, [dimensions.height, dimensions.width, innerRadius, players]);

  const tableStyle = useMemo(
    () => ({ '--table-tilt-deg': `${TABLE_TILT_DEG}deg` } as CSSProperties),
    []
  );

  const sceneStyle = useMemo(
    () => ({
      width: sceneWidth ?? '100%',
      justifyContent:
        sceneAlign === 'flex-start'
          ? 'flex-start'
          : sceneAlign === 'flex-end'
          ? 'flex-end'
          : 'center'
    }),
    [sceneAlign, sceneWidth]
  );

  return (
    <section className={styles.tableStage}>
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
