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
  potValue?: number;
  tableName?: string;
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
  potValue,
  tableName
}: GameTableProps) {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });

  useEffect(() => {
    const element = tableRef.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setDimensions(prev =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const tableDiameter = Math.min(dimensions.width, dimensions.height);
  const measurementBasis = tableDiameter > 0 ? tableDiameter : 520;
  const innerRadius = tableDiameter / 2;
  const avatarSize = Math.round(Math.min(Math.max(measurementBasis * 0.12, 64), 104));
  const handCardWidth = Math.round(Math.min(Math.max(measurementBasis * 0.16, 84), 136));
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

  const formattedPot = potValue == null ? '--' : potValue.toLocaleString();
  const tableStyle = useMemo(
    () => ({ '--table-tilt-deg': `${TABLE_TILT_DEG}deg` } as CSSProperties),
    []
  );

  return (
    <section className={styles.tableStage}>
      {tableName && <p className={styles.tableName}>{tableName}</p>}
      <div className={styles.tableScene}>
        <div ref={tableRef} className={styles.tableRing} style={tableStyle}>
          <div className={styles.tableSurface} aria-hidden="true">
            <div className={styles.tableInset} />
          </div>
          <div className={styles.centerGlow} aria-hidden="true" />
          <div className={styles.communityRow}>
            {communityCards.length > 0 ? (
              <CardRow
                cards={communityCards}
                size={{ width: communityCardWidth }}
                overlap="38%"
                angle={0}
              />
            ) : (
              <span className={styles.communityPlaceholder}>等待发公共牌…</span>
            )}
          </div>
          <div className={styles.potBadge}>
            <span className={styles.potLabel}>底池</span>
            <strong className={styles.potValue}>{formattedPot}</strong>
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
                    size={{ width: handCardWidth }}
                    overlap="64%"
                    angle={0}
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
