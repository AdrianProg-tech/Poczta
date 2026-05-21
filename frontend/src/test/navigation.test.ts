import { describe, it, expect } from 'vitest';
import { getDashboardPath, getRoleLabel } from '../app/navigation';

describe('getDashboardPath', () => {
  it('returns /client for client role', () => {
    expect(getDashboardPath('client')).toBe('/client');
  });

  it('returns /courier for courier role', () => {
    expect(getDashboardPath('courier')).toBe('/courier');
  });

  it('returns /point for point role', () => {
    expect(getDashboardPath('point')).toBe('/point');
  });

  it('returns /admin for admin role', () => {
    expect(getDashboardPath('admin')).toBe('/admin');
  });
});

describe('getRoleLabel', () => {
  it('returns Polish label for client', () => {
    expect(getRoleLabel('client')).toBe('Klient');
  });

  it('returns Polish label for courier', () => {
    expect(getRoleLabel('courier')).toBe('Kurier');
  });

  it('returns Polish label for point', () => {
    expect(getRoleLabel('point')).toBe('Punkt odbioru');
  });

  it('returns Polish label for admin', () => {
    expect(getRoleLabel('admin')).toBe('Administrator');
  });
});
