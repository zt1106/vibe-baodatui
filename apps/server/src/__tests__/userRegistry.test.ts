import { describe, it, expect } from 'vitest';
import {
  DuplicateNicknameError,
  UserNotFoundError,
  createUserRegistry
} from '../infrastructure/userRegistry';

describe('createUserRegistry', () => {
  it('registers users with incremental identifiers', () => {
    const registry = createUserRegistry();
    const alice = registry.register('Alice');
    const bob = registry.register('Bob');

    expect(alice.id).toBe(1);
    expect(bob.id).toBe(2);
    expect(alice.nickname).toBe('Alice');
    expect(alice.createdAt.valueOf()).toBeLessThanOrEqual(Date.now());
  });

  it('enforces nickname uniqueness regardless of casing or whitespace', () => {
    const registry = createUserRegistry();
    registry.register('Alice');
    expect(() => registry.register(' alice ')).toThrow(DuplicateNicknameError);
  });

  it('logs in an existing user and rejects unknown users', () => {
    const registry = createUserRegistry();
    registry.register('Bob');

    const login = registry.login(' bob ');
    expect(login.nickname).toBe('Bob');
    expect(() => registry.login('Charlie')).toThrow(UserNotFoundError);
  });
});
