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
    name: players.find(player => player.userId === id)?.nickname ?? `玩家 ${id}`
  }));

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
        <button type="button" className={styles.closeButton} onClick={onClose}>
          好的
        </button>
      </div>
    </div>
  );
}
