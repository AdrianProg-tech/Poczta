import { describe, it, expect, beforeEach } from 'vitest';
import { readStoredSession, persistStoredSession, AUTH_SESSION_STORAGE_KEY } from '../app/authSession';

describe('authSession', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('returns null when no session is stored', () => {
    expect(readStoredSession()).toBeNull();
  });

  it('persists and reads session correctly', () => {
    const session = { role: 'client' as const, email: 'test@example.com', accessToken: 'token123' };
    persistStoredSession(session);
    expect(readStoredSession()).toEqual(session);
  });

  it('removes session from storage when null is passed', () => {
    const session = { role: 'admin' as const, email: 'admin@example.com', accessToken: 'abc' };
    persistStoredSession(session);
    persistStoredSession(null);
    expect(window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
    expect(readStoredSession()).toBeNull();
  });

  it('handles corrupted session data gracefully', () => {
    window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, 'not-valid-json{{{');
    expect(readStoredSession()).toBeNull();
    expect(window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('uses correct storage key', () => {
    expect(AUTH_SESSION_STORAGE_KEY).toBe('pingwinpost-live-session-v1');
  });
});
