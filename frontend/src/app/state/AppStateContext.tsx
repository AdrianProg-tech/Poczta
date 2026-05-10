import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getCurrentUser, login, logout as logoutRequest, userFromAuthResponse } from '../api';
import { persistStoredSession, readStoredSession, type StoredSession } from '../authSession';
import type { AppState, AppUser, UserRole } from '../types';

interface AppStateContextValue {
  state: AppState;
  loginAsRole: (role: UserRole, identifier?: string, password?: string) => Promise<void>;
  logout: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

async function resolveUserFromSession(session: StoredSession): Promise<AppUser> {
  const authUser = await getCurrentUser(session.email);
  return userFromAuthResponse(session.role, authUser);
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    isLoading: true,
  });

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const storedSession = readStoredSession();

      if (!storedSession) {
        if (active) {
          setState({ currentUser: null, isLoading: false });
        }
        return;
      }

      try {
        const currentUser = await resolveUserFromSession(storedSession);
        if (active) {
          setState({ currentUser, isLoading: false });
        }
      } catch {
        persistStoredSession(null);
        if (active) {
          setState({ currentUser: null, isLoading: false });
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const loginAsRole = useCallback(async (role: UserRole, identifier?: string, password?: string) => {
    if (!identifier) {
      throw new Error('Brakuje adresu e-mail.');
    }
    if (!password) {
      throw new Error('Brakuje hasla.');
    }

    const authSession = await login(identifier, password);

    const session: StoredSession = {
      role,
      email: identifier,
      accessToken: authSession.accessToken,
    };

    const currentUser = userFromAuthResponse(role, authSession.currentUser);
    persistStoredSession(session);
    setState({ currentUser, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    void logoutRequest().catch(() => {
      // Clear local session even if the temporary backend session has already expired.
    });
    persistStoredSession(null);
    setState({ currentUser: null, isLoading: false });
  }, []);

  const value = useMemo(
    () => ({
      state,
      loginAsRole,
      logout,
    }),
    [loginAsRole, logout, state],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppStateContext() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppStateContext must be used within AppStateProvider');
  }

  return context;
}
