'use client';

import styles from './ReadyPanel.module.css';

type ReadyPanelProps = {
  capacity: number | null;
  playerCount: number;
  isSelfSeated: boolean;
  selfPrepared: boolean;
  canTogglePrepared: boolean;
  preparedButtonLabel: string;
  onTogglePrepared: () => void;
};

export function ReadyPanel({
  capacity,
  playerCount,
  isSelfSeated,
  selfPrepared,
  canTogglePrepared,
  preparedButtonLabel,
  onTogglePrepared
}: ReadyPanelProps) {
  return (
    <section className={styles.container}>
      <header>
        <h2 className={styles.header}>牌桌配置</h2>
        <p className={styles.summary}>更多选项即将上线</p>
      </header>
      <ul className={styles.list}>
        <li>最多玩家：{capacity ?? '—'} 名</li>
        <li>当前人数：{playerCount} 名</li>
      </ul>
      <button
        data-testid="ready-button"
        type="button"
        onClick={onTogglePrepared}
        disabled={!canTogglePrepared}
        className={`${styles.readyButton} ${selfPrepared ? styles.success : styles.primary} ${
          canTogglePrepared ? '' : styles.readyButtonDisabled
        }`}
      >
        {preparedButtonLabel}
      </button>
      <span className={styles.hint}>
        {isSelfSeated
          ? selfPrepared
            ? '已准备，等待房主开始对局。'
            : '点击准备后，等待房主操作。'
          : '加入座位后即可准备。'}
      </span>
    </section>
  );
}
