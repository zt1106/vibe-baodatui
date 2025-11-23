'use client';

import stageStyles from '../../../../components/poker/GameTableStage.module.css';

import type { ActionState } from './usePlayViewModel';

type ActionControlsProps = {
  actionState: ActionState | null;
};

const buildButtonClass = (variant?: 'secondary' | 'ghost') =>
  [stageStyles.actionButton, variant === 'secondary' ? stageStyles.secondaryAction : '', variant === 'ghost' ? stageStyles.ghostAction : '']
    .filter(Boolean)
    .join(' ');

const renderButton = (label: string, onClick: () => void, disabled?: boolean, variant?: 'secondary' | 'ghost', key?: string | number) => (
  <button key={key} type="button" className={buildButtonClass(variant)} disabled={disabled} onClick={onClick}>
    <span className={stageStyles.actionButtonLabel}>{label}</span>
  </button>
);

export function ActionControls({ actionState }: ActionControlsProps) {
  if (!actionState) return null;

  if (actionState.stage === 'bidding') {
    return (
      <div className={stageStyles.actionGroup}>
        {actionState.options.map(option => {
          const label = option.blocked ? `${option.label}（已叫）` : option.label;
          return renderButton(label, () => actionState.onSelect(option.value), actionState.disabled || option.blocked, option.variant, option.value);
        })}
      </div>
    );
  }

  if (actionState.stage === 'doubling') {
    return (
      <div className={stageStyles.actionGroup}>
        {actionState.options.map(option =>
          renderButton(option.label, () => actionState.onSelect(option.value), actionState.disabled, option.variant, String(option.value))
        )}
      </div>
    );
  }

  if (actionState.stage === 'playing') {
    return (
      <div className={stageStyles.actionGroup} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ color: '#e2e8f0', fontWeight: 700, textAlign: 'center', marginBottom: 6, minHeight: 20 }}>
          {actionState.comboLabel}
        </div>
        <div className={stageStyles.actionGroup}>
          {actionState.canPass ? renderButton('不出', actionState.onPass, false, 'ghost', 'pass') : null}
          {renderButton('出牌', actionState.onPlay, !actionState.canPlay, undefined, 'play')}
        </div>
      </div>
    );
  }

  return renderButton(actionState.label, () => undefined, true, undefined, 'waiting');
}
