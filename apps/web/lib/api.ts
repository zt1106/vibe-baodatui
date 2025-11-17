'use client';

export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';
  return base.replace(/\/$/, '');
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}