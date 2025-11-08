import clsx from 'clsx';
import type { CSSProperties, HTMLAttributes } from 'react';

export type CardBackVariant = 'red' | 'blue' | 'minimal' | 'neon';

const VARIANT_PALETTES: Record<CardBackVariant, { base: string; line: string; accent: string; pattern: string }> = {
  red: {
    base: '#7f1d1d',
    line: 'rgba(255, 255, 255, 0.35)',
    accent: '#fecaca',
    pattern: 'repeating-linear-gradient(45deg, rgba(254, 202, 202, 0.25) 0 12px, transparent 12px 24px)'
  },
  blue: {
    base: '#13224d',
    line: 'rgba(191, 219, 254, 0.55)',
    accent: 'rgba(96, 165, 250, 0.4)',
    pattern: 'repeating-linear-gradient(90deg, rgba(96, 165, 250, 0.35) 0 8px, transparent 8px 16px)'
  },
  minimal: {
    base: '#0f172a',
    line: 'rgba(226, 232, 240, 0.3)',
    accent: 'rgba(148, 163, 184, 0.4)',
    pattern: 'repeating-linear-gradient(45deg, rgba(148, 163, 184, 0.25) 0 10px, transparent 10px 20px)'
  },
  neon: {
    base: '#141432',
    line: 'rgba(168, 85, 247, 0.55)',
    accent: 'rgba(59, 130, 246, 0.45)',
    pattern: 'repeating-linear-gradient(90deg, rgba(236, 72, 153, 0.65) 0 6px, transparent 6px 12px)'
  }
};

export interface CardBackProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardBackVariant;
  customPatternUrl?: string;
}

type BackCSSVars = CSSProperties & Record<'--card-back-base' | '--card-back-line' | '--card-back-accent' | '--card-back-pattern' | '--card-back-custom', string | undefined>;

export function CardBack({ variant = 'red', customPatternUrl, className, style, ...rest }: CardBackProps) {
  const palette = VARIANT_PALETTES[variant] ?? VARIANT_PALETTES.red;
  const cssVars: BackCSSVars = {
    '--card-back-base': palette.base,
    '--card-back-line': palette.line,
    '--card-back-accent': palette.accent,
    '--card-back-pattern': palette.pattern,
    '--card-back-custom': undefined
  };

  if (customPatternUrl) {
    cssVars['--card-back-custom'] = `linear-gradient(rgba(2, 6, 23, 0.45), rgba(2, 6, 23, 0.45)), url(${customPatternUrl})`;
  }

  return (
    <div
      {...rest}
      className={clsx('v-card-back', className)}
      style={{ ...cssVars, ...style }}
    />
  );
}
