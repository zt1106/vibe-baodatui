import { AVATAR_FILENAMES } from '@shared/avatars';

import styles from './AvatarDialog.module.css';

type AvatarDialogProps = {
  isOpen: boolean;
  selectedAvatar: string | null;
  currentAvatar?: string | null;
  isUpdating: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
  onSelectAvatar: (filename: string) => void;
};

export function AvatarDialog({
  isOpen,
  selectedAvatar,
  currentAvatar,
  isUpdating,
  error,
  onClose,
  onConfirm,
  onSelectAvatar
}: AvatarDialogProps) {
  if (!isOpen) return null;
  const isConfirmDisabled = isUpdating || !selectedAvatar || selectedAvatar === currentAvatar;

  return (
    <div role="presentation" className={styles.overlay}>
      <div role="dialog" aria-modal="true" aria-label="选择头像" className={styles.dialog}>
        <header className={styles.header}>
          <h3 className={styles.title}>更换头像</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭头像选择"
            className={styles.closeButton}
          >
            ×
          </button>
        </header>
        <div className={styles.grid}>
          {AVATAR_FILENAMES.map(filename => {
            const isSelected = selectedAvatar === filename;
            return (
              <button
                key={filename}
                type="button"
                onClick={() => onSelectAvatar(filename)}
                aria-pressed={isSelected}
                className={`${styles.avatarButton} ${
                  isSelected ? styles.avatarButtonSelected : ''
                }`}
              >
                <img
                  src={`/avatars/${filename}`}
                  alt=""
                  width={70}
                  height={70}
                  loading="lazy"
                  className={styles.avatarImage}
                />
              </button>
            );
          })}
        </div>
        {error && <span className={styles.error}>{error}</span>}
        <div className={styles.actions}>
          <button type="button" onClick={onClose} disabled={isUpdating} className={styles.cancelButton}>
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className={styles.confirmButton}
          >
            {isUpdating ? '更新中…' : '确定'}
          </button>
        </div>
      </div>
    </div>
  );
}
