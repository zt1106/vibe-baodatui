import { pickRandomAvatar, type AvatarFilename } from '@shared/avatars';

export interface UserRecord {
  id: number;
  nickname: string;
  avatar: AvatarFilename;
  createdAt: Date;
}

export class DuplicateNicknameError extends Error {
  constructor(nickname: string) {
    super(`Nickname "${nickname}" is already registered`);
    this.name = 'DuplicateNicknameError';
  }
}

export class UserNotFoundError extends Error {
  constructor(nickname: string) {
    super(`No user found with nickname "${nickname}"`);
    this.name = 'UserNotFoundError';
  }
}

export function createUserRegistry() {
  let nextId = 1;
  const usersById = new Map<number, UserRecord>();
  const usersByNickname = new Map<string, UserRecord>();

  function normalizeNickname(nickname: string): string {
    return nickname.trim().toLowerCase();
  }

  function clone(user: UserRecord): UserRecord {
    return { ...user, createdAt: new Date(user.createdAt) };
  }

  function register(nickname: string): UserRecord {
    const trimmed = nickname.trim();
    const key = normalizeNickname(trimmed);
    if (usersByNickname.has(key)) {
      throw new DuplicateNicknameError(trimmed);
    }

    const record: UserRecord = {
      id: nextId++,
      nickname: trimmed,
      avatar: pickRandomAvatar(),
      createdAt: new Date()
    };

    usersByNickname.set(key, record);
    usersById.set(record.id, record);
    return clone(record);
  }

  function login(nickname: string): UserRecord {
    const key = normalizeNickname(nickname);
    const record = usersByNickname.get(key);
    if (!record) {
      throw new UserNotFoundError(nickname.trim());
    }
    return clone(record);
  }

  function findById(id: number): UserRecord | undefined {
    const record = usersById.get(id);
    return record ? clone(record) : undefined;
  }

  function findByNickname(nickname: string): UserRecord | undefined {
    const record = usersByNickname.get(normalizeNickname(nickname));
    return record ? clone(record) : undefined;
  }

  function updateAvatar(userId: number, avatar: AvatarFilename): UserRecord | undefined {
    const record = usersById.get(userId);
    if (!record) {
      return undefined;
    }
    record.avatar = avatar;
    return clone(record);
  }

  function updateNickname(userId: number, nickname: string): UserRecord | undefined {
    const record = usersById.get(userId);
    if (!record) {
      return undefined;
    }
    const trimmed = nickname.trim();
    const normalized = normalizeNickname(trimmed);
    const existing = usersByNickname.get(normalized);
    if (existing && existing.id !== userId) {
      throw new DuplicateNicknameError(trimmed);
    }
    const previousKey = normalizeNickname(record.nickname);
    usersByNickname.delete(previousKey);
    record.nickname = trimmed;
    usersByNickname.set(normalized, record);
    return clone(record);
  }

  function all(): UserRecord[] {
    return Array.from(usersById.values()).map(clone);
  }

  return {
    register,
    login,
    findById,
    findByNickname,
    updateAvatar,
    updateNickname,
    all
  };
}
