import styles from './NameDialog.module.css';

type NameDialogProps = {
  isOpen: boolean;
  nameDraft: string;
  isUpdating: boolean;
  error?: string | null;
  isSubmitDisabled: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onChangeName: (value: string) => void;
};

export function NameDialog({
  isOpen,
  nameDraft,
  isUpdating,
  error,
  isSubmitDisabled,
  onClose,
  onConfirm,
  onChangeName
}: NameDialogProps) {
  if (!isOpen) return null;

  return (
    <div role="presentation" className={styles.overlay}>
      <div role="dialog" aria-modal="true" aria-label="更改昵称" className={styles.dialog}>
        <header className={styles.header}>
          <h3 className={styles.title}>更改昵称</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭昵称对话框"
            className={styles.closeButton}
          >
            ×
          </button>
        </header>
        <label className={styles.field}>
          <span className={styles.label}>昵称</span>
          <input
            value={nameDraft}
            onChange={event => onChangeName(event.target.value)}
            maxLength={32}
            autoFocus
            className={styles.input}
          />
        </label>
        {error && <span className={styles.error}>{error}</span>}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className={styles.cancelButton}
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitDisabled}
            className={styles.saveButton}
          >
            {isUpdating ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
