'use client';

import styles from './HostControls.module.css';

type HostControlsProps = {
  playerCount: number;
  capacity: number | null;
  canStart: boolean;
  canAdjustCapacity: boolean;
  configDraft: number | null;
  capacityDisplay: number | null;
  capacityLockedValue?: number | null;
  configIsDirty: boolean;
  onStart: () => void;
  onAdjustCapacity: (delta: number) => void;
  onSaveCapacity: () => void;
};

export function HostControls({
  playerCount,
  capacity,
  canStart,
  canAdjustCapacity,
  configDraft,
  capacityDisplay,
  capacityLockedValue = null,
  configIsDirty,
  onStart,
  onAdjustCapacity,
  onSaveCapacity
}: HostControlsProps) {
  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>房主控制台</h2>
        <span className={styles.subtext}>
          当前人数：{playerCount} / {capacity ?? '—'}
        </span>
      </header>
      <button
        data-testid="start-game-button"
        type="button"
        onClick={onStart}
        disabled={!canStart}
        className={`${styles.startButton} ${canStart ? styles.startReady : styles.startDisabled}`}
      >
        开始对局
      </button>
      <div className={styles.controlGroup}>
        <span className={styles.label}>最多玩家数</span>
        <div className={styles.capacityRow}>
          <button
            data-testid="capacity-decrement"
            type="button"
            onClick={() => onAdjustCapacity(-1)}
            disabled={!canAdjustCapacity}
            className={`${styles.capacityButton} ${
              canAdjustCapacity ? styles.capacityButtonEnabled : styles.capacityButtonDisabled
            }`}
          >
            −
          </button>
          <strong data-testid="capacity-value" className={styles.capacityValue}>
            {configDraft ?? capacityDisplay}
          </strong>
          <button
            data-testid="capacity-increment"
            type="button"
            onClick={() => onAdjustCapacity(1)}
            disabled={!canAdjustCapacity}
            className={`${styles.capacityButton} ${
              canAdjustCapacity ? styles.capacityButtonEnabled : styles.capacityButtonDisabled
            }`}
          >
            ＋
          </button>
          <button
            data-testid="capacity-save-button"
            type="button"
            onClick={onSaveCapacity}
            disabled={!configIsDirty}
            className={`${styles.saveButton} ${configIsDirty ? styles.saveReady : styles.saveDisabled}`}
          >
            保存配置
          </button>
        </div>
        {capacityLockedValue && (
          <span className={styles.hint}>当前玩法固定 {capacityLockedValue} 人，无法调整。</span>
        )}
      </div>
    </section>
  );
}
