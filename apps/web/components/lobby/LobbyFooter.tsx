import type { HeartbeatStatus } from '../../lib/heartbeat';

import styles from './LobbyFooter.module.css';

type LobbyFooterProps = {
  status: HeartbeatStatus;
  latencyMs: number | null;
};

function resolveIndicatorColor(status: HeartbeatStatus) {
  if (status === 'online') return '#22c55e';
  if (status === 'degraded' || status === 'connecting') return '#facc15';
  return '#f87171';
}

export function LobbyFooter({ status, latencyMs }: LobbyFooterProps) {
  const indicatorColor = resolveIndicatorColor(status);
  const indicatorTone =
    status === 'online'
      ? '连接正常'
      : status === 'degraded'
      ? '连接不稳定'
      : status === 'connecting'
      ? '正在连接…'
      : '连接已断开';

  return (
    <footer className={styles.footer}>
      <div
        data-testid="lobby-connection-indicator"
        className={styles.indicator}
        style={{ ['--indicator-color' as string]: indicatorColor }}
      >
        <span className={styles.dot} />
        <span>{indicatorTone}</span>
      </div>
      {latencyMs !== null && (
        <span className={styles.latency}>当前延迟：{latencyMs.toFixed(0)} ms</span>
      )}
    </footer>
  );
}
