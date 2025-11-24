import type { GameResult } from '@shared/messages';

import styles from './GameResultDialog.module.css';

type PlayerSnapshot = {
  userId: number;
  nickname: string;
};

type GameResultDialogProps = {
  result: GameResult;
  players: PlayerSnapshot[];
  currentUserId?: number | null;
  onClose: () => void;
};

export function GameResultDialog({ result, players, currentUserId, onClose }: GameResultDialogProps) {
  const userWon = typeof currentUserId === 'number' && result.winningUserIds.includes(currentUserId);
  const winnerLabel = result.winner === 'LANDLORD' ? '地主获胜' : '农民获胜';
  const landlordName = players.find(player => player.userId === result.landlordUserId)?.nickname ?? '未知地主';
  const winners = result.winningUserIds.map(id => ({
    id,
    name:
      result.scores.find(entry => entry.userId === id)?.nickname ??
      players.find(player => player.userId === id)?.nickname ??
      `玩家 ${id}`
  }));

  const getPlayerName = (userId: number) =>
    result.scores.find(entry => entry.userId === userId)?.nickname ??
    players.find(player => player.userId === userId)?.nickname ??
    `玩家 ${userId}`;

  return (
    <div role="presentation" className={styles.overlay}>
      <div role="dialog" aria-modal="true" aria-label="本局结果" className={styles.dialog}>
        <div className={`${styles.badge} ${userWon ? styles.win : styles.lose}`}>
          {userWon ? '你赢了' : '你输了'}
        </div>
        <h3 className={styles.title}>本局结果</h3>
        <p className={styles.summary}>{winnerLabel}</p>
        <div className={styles.detailRow}>
          <span className={styles.label}>地主</span>
          <span className={styles.value}>{landlordName}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>获胜方</span>
          <div className={styles.winners}>
            {winners.length > 0 ? (
              winners.map(winner => (
                <span key={winner.id} className={styles.winnerChip}>
                  {winner.name}
                </span>
              ))
            ) : (
              <span className={styles.value}>尚未记录</span>
            )}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>叫分</span>
            <span className={styles.statValue}>{result.callScore}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>炸弹</span>
            <span className={styles.statValue}>× {result.bombCount}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>王炸</span>
            <span className={styles.statValue}>× {result.rocketCount}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>春天</span>
            <span className={styles.statValue}>{result.spring ? '是' : '否'}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>加倍</span>
            <span className={styles.statValue}>
              {result.landlordRedoubled ? '地主再加倍' : '无再加倍'}
            </span>
          </div>
        </div>

        <div className={styles.scoreTable} role="table" aria-label="结算明细">
          <div className={`${styles.scoreRow} ${styles.scoreHeader}`} role="row">
            <div className={styles.colPlayer} role="columnheader">
              玩家
            </div>
            <div className={styles.colRole} role="columnheader">
              身份
            </div>
            <div className={styles.colScore} role="columnheader">
              分数
            </div>
            <div className={styles.colMultiplier} role="columnheader">
              倍数
            </div>
            <div className={styles.colFactors} role="columnheader">
              贡献倍数
            </div>
          </div>
          {result.scores.map(entry => (
            <div className={styles.scoreRow} role="row" key={entry.userId}>
              <div className={styles.colPlayer} role="cell">
                {getPlayerName(entry.userId)}
              </div>
              <div className={styles.colRole} role="cell">
                <span className={`${styles.roleBadge} ${entry.role === 'LANDLORD' ? styles.landlord : styles.farmer}`}>
                  {entry.role === 'LANDLORD' ? '地主' : '农民'}
                </span>
              </div>
              <div className={styles.colScore} role="cell">
                <span className={entry.score >= 0 ? styles.positive : styles.negative}>
                  {entry.score > 0 ? `+${entry.score}` : entry.score}
                </span>
              </div>
              <div className={styles.colMultiplier} role="cell">
                {typeof entry.multiplier === 'number' && typeof entry.exponent === 'number'
                  ? `2^${entry.exponent} = ×${entry.multiplier}`
                  : '—'}
              </div>
              <div className={styles.colFactors} role="cell">
                <div className={styles.factorChips}>
                  <span className={styles.factorChip}>炸弹 {entry.factors.bombs}</span>
                  <span className={styles.factorChip}>王炸 {entry.factors.rockets}</span>
                  <span className={styles.factorChip}>{entry.factors.spring ? '春天' : '无春天'}</span>
                  <span className={styles.factorChip}>
                    {entry.role === 'FARMER'
                      ? entry.factors.defenderDouble
                        ? '农民加倍'
                        : '未加倍'
                      : entry.doubled
                        ? '地主再加倍'
                        : '未再加倍'}
                  </span>
                  {entry.factors.landlordRedouble && entry.role === 'FARMER' && (
                    <span className={styles.factorChip}>再加倍生效</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" className={styles.closeButton} onClick={onClose}>
          好的
        </button>
      </div>
    </div>
  );
}
