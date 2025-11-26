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

  it('allows updating a user avatar', () => {
    const registry = createUserRegistry();
    const alice = registry.register('Alice');
    const updated = registry.updateAvatar(alice.id, 'memo_12.png');
    expect(updated).toBeDefined();
    expect(updated?.avatar).toBe('memo_12.png');
    const reloaded = registry.login('alice');
    expect(reloaded.avatar).toBe('memo_12.png');
  });

  describe('duplicate nickname edge cases', () => {
    it('prevents duplicate nicknames with various whitespace and casing combinations', () => {
      const registry = createUserRegistry();
      registry.register('Alice');

      // Exact duplicate should fail
      expect(() => registry.register('Alice')).toThrow(DuplicateNicknameError);

      // Different casing
      expect(() => registry.register('alice')).toThrow(DuplicateNicknameError);
      expect(() => registry.register('ALICE')).toThrow(DuplicateNicknameError);
      expect(() => registry.register('aLiCe')).toThrow(DuplicateNicknameError);

      // With leading/trailing whitespace
      expect(() => registry.register(' Alice')).toThrow(DuplicateNicknameError);
      expect(() => registry.register('Alice ')).toThrow(DuplicateNicknameError);
      expect(() => registry.register(' Alice ')).toThrow(DuplicateNicknameError);

      // Multiple spaces
      expect(() => registry.register('  Alice  ')).toThrow(DuplicateNicknameError);

      // Tabs and mixed whitespace
      expect(() => registry.register('\tAlice\t')).toThrow(DuplicateNicknameError);
      expect(() => registry.register(' \talice ')).toThrow(DuplicateNicknameError);
    });

    it('throws DuplicateNicknameError with correct message', () => {
      const registry = createUserRegistry();
      registry.register('TestUser');

      try {
        registry.register('testuser');
        expect.fail('Should have thrown DuplicateNicknameError');
      } catch (error) {
        expect(error).toBeInstanceOf(DuplicateNicknameError);
        expect((error as DuplicateNicknameError).message).toContain('testuser');
        expect((error as DuplicateNicknameError).name).toBe('DuplicateNicknameError');
      }
    });

    it('allows similar but distinct nicknames', () => {
      const registry = createUserRegistry();
      const alice = registry.register('Alice');
      const alice2 = registry.register('Alice2');
      const aliceB = registry.register('AliceB');

      expect(alice.nickname).toBe('Alice');
      expect(alice2.nickname).toBe('Alice2');
      expect(aliceB.nickname).toBe('AliceB');
      expect(alice.id).not.toBe(alice2.id);
      expect(alice.id).not.toBe(aliceB.id);
    });

    it('handles special characters in nicknames', () => {
      const registry = createUserRegistry();
      const user1 = registry.register('User-1');
      const user2 = registry.register('User_2');
      const user3 = registry.register('User@3');

      expect(user1.nickname).toBe('User-1');
      expect(user2.nickname).toBe('User_2');
      expect(user3.nickname).toBe('User@3');

      // Case insensitive duplicates still caught
      expect(() => registry.register('user-1')).toThrow(DuplicateNicknameError);
      expect(() => registry.register('USER_2')).toThrow(DuplicateNicknameError);
    });
  });

  describe('updateNickname with duplicate prevention', () => {
    it('prevents updating to an existing nickname', () => {
      const registry = createUserRegistry();
      const _alice = registry.register('Alice');
      const bob = registry.register('Bob');

      // Try to change Bob's name to Alice (should fail)
      expect(() => registry.updateNickname(bob.id, 'Alice')).toThrow(DuplicateNicknameError);
      expect(() => registry.updateNickname(bob.id, 'alice')).toThrow(DuplicateNicknameError);
      expect(() => registry.updateNickname(bob.id, ' ALICE ')).toThrow(DuplicateNicknameError);

      // Verify Bob's name unchanged
      const bobStill = registry.login('Bob');
      expect(bobStill.nickname).toBe('Bob');
    });

    it('allows updating to the same nickname with different casing', () => {
      const registry = createUserRegistry();
      const alice = registry.register('Alice');

      // Updating Alice to alice should work (same user)
      const updated = registry.updateNickname(alice.id, 'alice');
      expect(updated).toBeDefined();
      expect(updated?.nickname).toBe('alice');

      // Can still login with case-insensitive match
      const reloaded = registry.login('ALICE');
      expect(reloaded.id).toBe(alice.id);
      expect(reloaded.nickname).toBe('alice'); // Stored as 'alice' now
    });

    it('properly updates nickname map when changing names', () => {
      const registry = createUserRegistry();
      const user = registry.register('OldName');

      // Update to new name
      const updated = registry.updateNickname(user.id, 'NewName');
      expect(updated?.nickname).toBe('NewName');

      // Old name should no longer work for login
      expect(() => registry.login('OldName')).toThrow(UserNotFoundError);
      expect(() => registry.login('oldname')).toThrow(UserNotFoundError);

      // New name should work
      const found = registry.login('NewName');
      expect(found.id).toBe(user.id);
      expect(found.nickname).toBe('NewName');

      // Old name should be available for a new user
      const newUser = registry.register('OldName');
      expect(newUser.id).not.toBe(user.id);
      expect(newUser.nickname).toBe('OldName');
    });

    it('returns undefined for non-existent user ID', () => {
      const registry = createUserRegistry();
      const result = registry.updateNickname(999, 'NewName');
      expect(result).toBeUndefined();
    });
  });

  describe('findByNickname with case insensitivity', () => {
    it('finds users regardless of casing', () => {
      const registry = createUserRegistry();
      const alice = registry.register('Alice');

      expect(registry.findByNickname('Alice')?.id).toBe(alice.id);
      expect(registry.findByNickname('alice')?.id).toBe(alice.id);
      expect(registry.findByNickname('ALICE')?.id).toBe(alice.id);
      expect(registry.findByNickname('aLiCe')?.id).toBe(alice.id);
      expect(registry.findByNickname(' Alice ')?.id).toBe(alice.id);
    });

    it('returns undefined for non-existent nicknames', () => {
      const registry = createUserRegistry();
      registry.register('Alice');

      expect(registry.findByNickname('Bob')).toBeUndefined();
      expect(registry.findByNickname('NotFound')).toBeUndefined();
      expect(registry.findByNickname('')).toBeUndefined();
    });
  });

  describe('login with case insensitivity', () => {
    it('logs in users with case-insensitive matching', () => {
      const registry = createUserRegistry();
      const original = registry.register('TestUser');

      const login1 = registry.login('TestUser');
      expect(login1.id).toBe(original.id);

      const login2 = registry.login('testuser');
      expect(login2.id).toBe(original.id);

      const login3 = registry.login('TESTUSER');
      expect(login3.id).toBe(original.id);

      const login4 = registry.login(' TestUser ');
      expect(login4.id).toBe(original.id);
    });

    it('preserves original nickname casing in returned user', () => {
      const registry = createUserRegistry();
      registry.register('MixedCase');

      // Login with different casing
      const user = registry.login('mixedcase');
      // Should return the original registered nickname
      expect(user.nickname).toBe('MixedCase');
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('handles empty and whitespace-only nicknames gracefully', () => {
      const registry = createUserRegistry();
      
      // Empty string after trim
      const empty = registry.register('');
      expect(empty.nickname).toBe('');

      // Whitespace-only becomes empty after trim - should be a duplicate
      expect(() => registry.register('   ')).toThrow(DuplicateNicknameError);
      expect(() => registry.register(' ')).toThrow(DuplicateNicknameError);
      expect(() => registry.register('\t')).toThrow(DuplicateNicknameError);
    });

    it('handles very long nicknames', () => {
      const registry = createUserRegistry();
      const longName = 'A'.repeat(1000);
      const user = registry.register(longName);
      expect(user.nickname).toBe(longName);

      // Duplicate with same long name should fail
      expect(() => registry.register(longName.toLowerCase())).toThrow(DuplicateNicknameError);
    });

    it('maintains separate ID and nickname spaces', () => {
      const registry = createUserRegistry();
      const user1 = registry.register('User1');
      const user2 = registry.register('User2');
      const user3 = registry.register('User3');

      // IDs should be sequential
      expect(user1.id).toBe(1);
      expect(user2.id).toBe(2);
      expect(user3.id).toBe(3);

      // Nicknames are independent
      expect(registry.findById(1)?.nickname).toBe('User1');
      expect(registry.findById(2)?.nickname).toBe('User2');
      expect(registry.findById(3)?.nickname).toBe('User3');
    });

    it('returns cloned user records to prevent external mutation', () => {
      const registry = createUserRegistry();
      const original = registry.register('Alice');
      
      const found = registry.findById(original.id);
      expect(found).toBeDefined();
      
      // Mutating returned object shouldn't affect registry
      if (found) {
        found.nickname = 'Modified';
      }

      const refetch = registry.findById(original.id);
      expect(refetch?.nickname).toBe('Alice'); // Should still be Alice
    });
  });
});
