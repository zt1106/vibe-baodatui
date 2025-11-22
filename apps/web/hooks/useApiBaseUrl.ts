'use client';

import { useMemo } from 'react';

import { getApiBaseUrl } from '../lib/api';

export function useApiBaseUrl(): string {
  return useMemo(() => getApiBaseUrl(), []);
}
