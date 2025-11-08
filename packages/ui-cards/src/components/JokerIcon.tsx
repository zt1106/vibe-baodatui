'use client';

import { useId, type SVGProps } from 'react';

export type JokerTone = 'black' | 'red';

export interface JokerIconProps extends Omit<SVGProps<SVGSVGElement>, 'color'> {
  tone?: JokerTone;
  size?: number;
}

const TONE_PRESETS: Record<JokerTone, { accent: string; base: string; highlight: string }> = {
  black: {
    accent: '#38bdf8',
    base: '#0f172a',
    highlight: '#e0f2fe'
  },
  red: {
    accent: '#f87171',
    base: '#7f1d1d',
    highlight: '#fee2e2'
  }
};

export function JokerIcon({ tone = 'black', size = 48, style, ...rest }: JokerIconProps) {
  const gradientId = useId();
  const palette = TONE_PRESETS[tone];

  return (
    <svg
      {...rest}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-hidden
      focusable="false"
      style={{
        display: 'block',
        ...style
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={palette.highlight} />
          <stop offset="100%" stopColor={palette.accent} />
        </linearGradient>
      </defs>
      <path
        d="M8 30C10 16 18 12 24 20C26 22 30 14 34 20C38 26 44 14 56 30L50 36C45 40 39 43 32 43C25 43 19 40 14 36Z"
        fill={`url(#${gradientId})`}
        stroke={palette.accent}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M14 36L10 54C20 58 44 58 54 54L50 36"
        fill={palette.base}
        stroke={palette.accent}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <circle cx="12" cy="20" r="3" fill={palette.accent} />
      <circle cx="30" cy="14" r="3" fill={palette.accent} />
      <circle cx="52" cy="20" r="3" fill={palette.accent} />
      <path
        d="M24 48C24 48 28 52 32 52C36 52 40 48 40 48"
        stroke={palette.highlight}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
}
