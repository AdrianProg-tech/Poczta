import type { UserRole } from './types';

export const AUTH_SESSION_STORAGE_KEY = 'pingwinpost-live-session-v1';

export interface StoredSession {
  role: UserRole;
  email: string;
  accessToken: string;
}

export function readStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return null;
  }
}

export function persistStoredSession(session: StoredSession | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!session) {
    window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}
