import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { loadServerEnv } from '../env';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('loadServerEnv', () => {
  it('returns defaults when env vars are absent', () => {
    delete process.env.PORT;
    delete process.env.WEB_ORIGINS;
    const env = loadServerEnv();
    expect(env.PORT).toBe('3001');
    expect(env.WEB_ORIGINS).toBe('http://localhost:3000,http://127.0.0.1:3000');
  });

  it('uses provided env values', () => {
    process.env.PORT = '4000';
    process.env.WEB_ORIGINS = 'https://foo.test';
    const env = loadServerEnv();
    expect(env.PORT).toBe('4000');
    expect(env.WEB_ORIGINS).toBe('https://foo.test');
  });

  it('exits when validation fails', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit ${code}`);
    }) as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (process.env as any).PORT = 123;

    expect(() => loadServerEnv()).toThrow(/exit 1/);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();
  });
});
