import { getCardDimensions } from '@poker/core-cards';
import { type CardAnimationOptions, type CardRowProps } from '@poker/ui-cards';

export const AVATAR_POSITION = { x: 40, y: 32 };
export const TARGET_ROW_OFFSET = { left: 64, top: 220 };
export const TARGET_ROW_ANGLE = 0;
export const TARGET_ROW_CURVE = 0;
export const TARGET_ROW_OVERLAP = '32%' as const;

export const INCOMING_TRANSITION = {
  type: 'spring',
  stiffness: 340,
  damping: 38,
  mass: 0.95,
  bounce: 0
};

export const TARGET_ROW_ANIMATION: CardAnimationOptions = {
  disabled: true
};

export const CARD_SIZE = getCardDimensions('md');

export const STORY_LAYOUT_STYLE = {
  borderRadius: 32,
  padding: 24,
  background: 'rgba(15, 23, 42, 0.95)',
  display: 'flex',
  flexDirection: 'column',
  gap: 24
} as const;

export const INCOMING_AREA_STYLE = {
  position: 'relative',
  minHeight: 420,
  borderRadius: 28,
  background: 'radial-gradient(circle at 48px 32px, rgba(56, 189, 248, 0.15), transparent 45%)',
  padding: 16,
  paddingBottom: 48,
  overflow: 'visible'
} as const;

export const AVATAR_MARKER_STYLE = {
  position: 'absolute',
  left: AVATAR_POSITION.x,
  top: AVATAR_POSITION.y,
  display: 'flex',
  alignItems: 'center',
  gap: 10
} as const;

export const AVATAR_BADGE_STYLE = {
  width: 52,
  height: 52,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
  boxShadow: '0 18px 30px rgba(37, 99, 235, 0.45)'
} as const;

export const PLAY_AREA_STYLE = {
  position: 'absolute',
  left: TARGET_ROW_OFFSET.left,
  top: TARGET_ROW_OFFSET.top,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  zIndex: 1,
  width: '100%'
} as const;

export const CONTROLS_STYLE = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap'
} as const;

export const DESCRIPTION_TEXT_STYLE = {
  margin: 0,
  color: '#94a3b8',
  fontSize: '0.95rem'
} as const;

export const QUEUE_TEXT_STYLE = {
  color: '#cbd5f5',
  fontSize: '0.95rem'
} as const;

export const INCOMING_CARD_STYLE = {
  position: 'absolute',
  width: CARD_SIZE.width,
  height: CARD_SIZE.height,
  pointerEvents: 'none',
  zIndex: 2
} as const;

const PANEL_STYLE_BASE = {
  borderRadius: 32,
  padding: 24,
  background: 'rgba(15, 23, 42, 0.8)',
  display: 'flex',
  flexDirection: 'column'
} as const;

export function buildPanelStyle(gap: number) {
  return { ...PANEL_STYLE_BASE, gap };
}

export function resolveOverlapPx(overlap: CardRowProps['overlap'], cardWidth: number) {
  if (typeof overlap === 'string' && overlap.endsWith('%')) {
    const parsed = Number.parseFloat(overlap);
    if (Number.isFinite(parsed)) {
      return (Math.max(0, Math.min(parsed, 100)) / 100) * cardWidth;
    }
    return 0;
  }
  return Number.isFinite(Number(overlap)) ? Number(overlap) : 0;
}
