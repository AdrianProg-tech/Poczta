export type UserRole = 'client' | 'courier' | 'point' | 'admin';
export type AdminScope = 'ADMIN' | 'DISPATCHER';

export interface AppUser {
  role: UserRole;
  availableRoles: UserRole[];
  name: string;
  email?: string;
  id?: string;
  pointCode?: string;
  pointName?: string;
  serviceCity?: string;
  location?: string;
  adminScope?: AdminScope;
}

export interface AppState {
  currentUser: AppUser | null;
  isLoading: boolean;
}
