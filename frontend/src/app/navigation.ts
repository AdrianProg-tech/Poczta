import type { UserRole } from './types';

export function getDashboardPath(role: UserRole) {
  switch (role) {
    case 'client':
      return '/client';
    case 'courier':
      return '/courier';
    case 'point':
      return '/point';
    case 'admin':
      return '/admin';
  }
}

export function getRoleLabel(role: UserRole) {
  switch (role) {
    case 'client':
      return 'Klient';
    case 'courier':
      return 'Kurier';
    case 'point':
      return 'Punkt odbioru';
    case 'admin':
      return 'Administrator';
  }
}
