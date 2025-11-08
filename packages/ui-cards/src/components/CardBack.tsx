import clsx from 'clsx';
import type { CSSProperties, HTMLAttributes } from 'react';

export type CardBackVariant = 'red' | 'blue' | 'minimal';

const VARIANT_PALETTES: Record<CardBackVariant, { background: string; border: string; accent: string }> = {
  red: { background: '#7f1d1d', border: '#fecaca', accent: '#f87171' },
  blue: { background: '#1e3a8a', border: '#bfdbfe', accent: '#60a5fa' },
  minimal: { background: '#0f172a', border: '#cbd5f5', accent: '#94a3b8' }
};

export interface CardBackProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardBackVariant;
  customPatternUrl?: string;
}

function buildPattern(accent: string) {
  return `repeating-linear-gradient(45deg, transparent 0, transparent 6px, ${accent} 7px, ${accent} 8px)`;
}

export function CardBack({
  variant = 'red',
  customPatternUrl,
  className,
  style,
  ...rest
}: CardBackProps) {
  const palette = VARIANT_PALETTES[variant] ?? VARIANT_PALETTES.red;
  const patternStyle: CSSProperties = customPatternUrl
    ? {
        backgroundImage: `linear-gradient(rgba(2, 6, 23, 0.55), rgba(2, 6, 23, 0.55)), url(${customPatternUrl})`,
        backgroundSize: 'cover'
      }
    : {
        backgroundImage: buildPattern(palette.accent),
        backgroundSize: '180% 180%',
        backgroundPosition: 'center'
      };

  return (
    <div
      {...rest}
      className={clsx('v-card-back', className)}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 'inherit',
        border: `2px solid ${palette.border}`,
        backgroundColor: palette.background,
        padding: '8%',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        ...patternStyle,
        ...style
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '12%',
          borderRadius: 16,
          border: `2px dashed ${palette.border}`,
          mixBlendMode: 'screen'
        }}
      />
    </div>
  );
}
