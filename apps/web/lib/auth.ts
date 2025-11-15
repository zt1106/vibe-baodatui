import { generateRandomChineseName } from './nickname';

export type StoredUser = { id: number; nickname: string; avatar: string };

const USER_STORAGE_KEY = 'auth:user';

function readStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function parseStoredUser(raw: string | null): StoredUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredUser;
    if (
      typeof parsed?.id === 'number' &&
      typeof parsed?.nickname === 'string' &&
      typeof parsed?.avatar === 'string'
    ) {
      return parsed;
    }
  } catch {
    // ignore malformed storage values
  }
  return null;
}

export function loadStoredUser(): StoredUser | null {
  const storage = readStorage();
  return storage ? parseStoredUser(storage.getItem(USER_STORAGE_KEY)) : null;
}

export function persistStoredUser(user: StoredUser) {
  const storage = readStorage();
  if (!storage) return;
  storage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  const storage = readStorage();
  if (!storage) return;
  storage.removeItem(USER_STORAGE_KEY);
}

async function parseUserResponse(response: Response): Promise<StoredUser> {
  const data = (await response.json()) as {
    user: { id: number; nickname: string; avatar: string };
  };
  if (
    !data?.user ||
    typeof data.user.id !== 'number' ||
    typeof data.user.nickname !== 'string' ||
    typeof data.user.avatar !== 'string'
  ) {
    throw new Error('Malformed user payload');
  }
  return data.user;
}

export async function ensureUser(apiBaseUrl: string, nickname: string): Promise<StoredUser> {
  const sanitized = nickname.trim() || generateRandomChineseName();
  const headers = { 'Content-Type': 'application/json' };
  try {
    const registerResponse = await fetch(`${apiBaseUrl}/auth/register`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ nickname: sanitized })
    });
    if (registerResponse.ok) {
      return parseUserResponse(registerResponse);
    }
    if (registerResponse.status !== 409) {
      throw new Error(`Failed to register nickname (status ${registerResponse.status})`);
    }
    const loginResponse = await fetch(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ nickname: sanitized })
    });
    if (!loginResponse.ok) {
      throw new Error(`Failed to login nickname (status ${loginResponse.status})`);
    }
    return parseUserResponse(loginResponse);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unknown authentication error');
  }
}
