import { afterEach, describe, expect, it, vi } from 'vitest';
import { AVATAR_FILENAMES, DEFAULT_AVATAR, pickRandomAvatar } from '../avatars';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('avatars', () => {
  it('returns the first and last avatar when random is stubbed at bounds', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(pickRandomAvatar()).toBe(AVATAR_FILENAMES[0]);

    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(pickRandomAvatar()).toBe(AVATAR_FILENAMES[AVATAR_FILENAMES.length - 1]);
  });

  it('never returns values outside the allowed list', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.42);
    const choice = pickRandomAvatar();
    expect(AVATAR_FILENAMES).toContain(choice);
  });

  it('keeps DEFAULT_AVATAR in sync with the first entry', () => {
    expect(DEFAULT_AVATAR).toBe(AVATAR_FILENAMES[0]);
  });
});
