import { describe, expect, test, vi, afterEach, beforeEach } from 'vitest';
import { getApiBaseUrl, fetchJson } from './api';

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH as typeof fetch;
  process.env = { ...ORIGINAL_ENV };
});

describe('getApiBaseUrl', () => {
  test('uses NEXT_PUBLIC_SOCKET_URL and trims trailing slash', () => {
    process.env.NEXT_PUBLIC_SOCKET_URL = 'http://example.com/';
    const base = getApiBaseUrl();
    expect(base).toBe('http://example.com');
  });

  test('falls back to localhost and trims trailing slash', () => {
    delete process.env.NEXT_PUBLIC_SOCKET_URL;
    const base = getApiBaseUrl();
    expect(base).toBe('http://localhost:3001');
  });
});

describe('fetchJson', () => {
  test('returns parsed JSON when response is ok', async () => {
    const payload = { ok: true };
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => payload,
    })) as unknown as typeof fetch;

    const data = await fetchJson<typeof payload>('http://example.com/api');
    expect(data).toEqual(payload);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  test('throws on non-ok response', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'boom' }),
    })) as unknown as typeof fetch;

    await expect(fetchJson('http://example.com/api')).rejects.toThrow(/status 500/);
  });
});