import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { initialAppState } from '../mock-data';
import type {
  AppState,
  AppUser,
  Claim,
  Shipment,
  ShipmentDraft,
  UserRole,
} from '../types';

const STORAGE_KEY = 'pingwinpost-app-state-v1';

type AppAction =
  | { type: 'LOGIN'; payload: { user: AppUser } }
  | { type: 'LOGOUT' }
  | { type: 'CREATE_SHIPMENT'; payload: { shipment: Shipment } }
  | { type: 'CREATE_CLAIM'; payload: { claim: Claim } };

interface AppStateContextValue {
  state: AppState;
  loginAsRole: (role: UserRole, email?: string) => void;
  logout: () => void;
  createShipment: (draft: ShipmentDraft) => string;
  createClaim: (shipmentId: string, subject: string, description: string) => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        currentUser: action.payload.user,
      };
    case 'LOGOUT':
      return {
        ...state,
        currentUser: null,
      };
    case 'CREATE_SHIPMENT':
      return {
        ...state,
        shipments: [action.payload.shipment, ...state.shipments],
      };
    case 'CREATE_CLAIM':
      return {
        ...state,
        claims: [action.payload.claim, ...state.claims],
      };
    default:
      return state;
  }
}

function loadInitialState() {
  if (typeof window === 'undefined') {
    return initialAppState;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return initialAppState;
  }

  try {
    return JSON.parse(stored) as AppState;
  } catch {
    return initialAppState;
  }
}

function formatDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatDateTime() {
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

function generateShipmentId() {
  const suffix = String(Date.now()).slice(-9);
  return `PW${suffix}PL`;
}

function generateClaimId(existingClaims: Claim[]) {
  const nextNumber = existingClaims.length + 1;
  return `REK${String(nextNumber).padStart(3, '0')}`;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, loadInitialState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const loginAsRole = useCallback(
    (role: UserRole, email?: string) => {
      const fallbackUser = initialAppState.users.find((user) => user.role === role);
      const matchedUser =
        state.users.find((user) => user.role === role && (!email || user.email === email)) ?? fallbackUser;

      if (!matchedUser) {
        return;
      }

      dispatch({
        type: 'LOGIN',
        payload: { user: matchedUser },
      });
    },
    [state.users],
  );

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const createShipment = useCallback(
    (draft: ShipmentDraft) => {
      const currentUser = state.currentUser ?? initialAppState.users[0];
      const shipmentId = generateShipmentId();
      const createdAt = formatDateTime();
      const paymentStatus =
        draft.paymentMethod === 'Płatność w punkcie' ? 'Offline — do potwierdzenia' : 'Opłacona';
      const shipment: Shipment = {
        id: shipmentId,
        clientId: currentUser.id,
        pointId: 'point-warsaw',
        assignedCourierId: 'courier-marek',
        status: paymentStatus === 'Opłacona' ? 'Utworzona' : 'Nadana',
        created: createdAt,
        estimatedDelivery: formatDate(2),
        sender: draft.sender,
        recipient: draft.recipient,
        package: draft.package,
        payment: {
          status: paymentStatus,
          method: draft.paymentMethod,
          amount: draft.paymentMethod === 'Płatność w punkcie' ? '26.99 PLN' : '24.99 PLN',
          date: createdAt,
        },
        history: [
          {
            date: createdAt,
            location: 'Online',
            status: 'Utworzona',
            description: 'Przesyłka utworzona',
          },
        ],
      };

      dispatch({
        type: 'CREATE_SHIPMENT',
        payload: { shipment },
      });

      return shipmentId;
    },
    [state.currentUser],
  );

  const createClaim = useCallback(
    (shipmentId: string, subject: string, description: string) => {
      const claim: Claim = {
        id: generateClaimId(state.claims),
        shipmentId,
        clientId: state.currentUser?.id ?? 'client-jan',
        subject,
        description,
        status: 'Nowa',
        created: formatDateTime(),
      };

      dispatch({
        type: 'CREATE_CLAIM',
        payload: { claim },
      });
    },
    [state.claims, state.currentUser],
  );

  const value = useMemo(
    () => ({
      state,
      loginAsRole,
      logout,
      createShipment,
      createClaim,
    }),
    [state, loginAsRole, logout, createShipment, createClaim],
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
