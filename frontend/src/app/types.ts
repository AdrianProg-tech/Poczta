export type UserRole = 'client' | 'courier' | 'point' | 'admin';

export interface AppUser {
  role: UserRole;
  name: string;
  email?: string;
  id?: string;
  pointCode?: string;
  location?: string;
}

export interface AppState {
  currentUser: AppUser | null;
  isLoading: boolean;
}
