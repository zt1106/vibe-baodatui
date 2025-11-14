'use client';

import type { CSSProperties, ReactNode } from 'react';

import styles from './PokerTableBackground.module.css';

export type PokerTableBackgroundProps = {
  width?: number | string;
  height?: number | string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function PokerTableBackground({
  width = '100%',
  height = 320,
  children,
  className,
  style
}: PokerTableBackgroundProps) {
  const rootClass = [styles.tableRoot, className].filter(Boolean).join(' ');
  const rootStyle: CSSProperties = {
    width,
    height,
    ...style
  };

  return (
    <div className={styles.centering}>
      <div className={rootClass} style={rootStyle}>
        <div className={styles.tableSurface}>
          {children && <div className={styles.children}>{children}</div>}
        </div>
      </div>
    </div>
  );
}
