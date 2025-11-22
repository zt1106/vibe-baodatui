'use client';

import type { ReactNode } from 'react';

import { GameTable, type GameTableProps } from './GameTable';

import styles from './GameTableStage.module.css';

export type GameTableStageProps = GameTableProps & {
  actions?: ReactNode;
};

export function GameTableStage({
  actions,
  handCardRowGap = 0,
  handCardRowOverlap = 40,
  ...gameTableProps
}: GameTableStageProps) {
  return (
    <div className={styles.stageShell}>
      {actions ? (
        <div className={styles.actions}>
          <div className={styles.actionsInner}>{actions}</div>
        </div>
      ) : null}
      <GameTable handCardRowGap={handCardRowGap} handCardRowOverlap={handCardRowOverlap} {...gameTableProps} />
    </div>
  );
}
