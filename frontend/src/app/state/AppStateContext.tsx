import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getCurrentUser, getPublicPoints, userFromAuthResponse } from '../api';
import type { AppState, AppUser, UserRole } from '../types';

const STORAGE_KEY = 'pingwinpost-live-session-v1';

interface StoredSession {
  role: UserRole;
  email?: string;
  pointCode?: string;
}

interface AppStateContextValue {
  state: AppState;
  loginAsRole: (role: UserRole, identifier?: string) => Promise<void>;
  logout: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

function readStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistStoredSession(session: StoredSession | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!session) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

async function buildPointUser(pointCode: string): Promise<AppUser> {
  const points = await getPublicPoints();
  const point = points.find((item) => item.pointCode === pointCode);

  if (!point) {
    throw new Error('Wybrany punkt nie istnieje.');
  }

  return {
    role: 'point',
    name: point.name,
    pointCode: point.pointCode,
    location: `${point.city}, ${point.address}`,
  };
}

async function resolveUserFromSession(session: StoredSession): Promise<AppUser> {
  if (session.role === 'point') {
    if (!session.pointCode) {
      throw new Error('Brakuje kodu punktu.');
    }

    return buildPointUser(session.pointCode);
  }

  if (!session.email) {
    throw new Error('Brakuje adresu e-mail.');
  }

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

  const loginAsRole = useCallback(async (role: UserRole, identifier?: string) => {
    const session: StoredSession =
      role === 'point'
        ? {
            role,
            pointCode: identifier,
          }
        : {
            role,
            email: identifier,
          };

    const currentUser = await resolveUserFromSession(session);
    persistStoredSession(session);
    setState({ currentUser, isLoading: false });
  }, []);

  const logout = useCallback(() => {
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
