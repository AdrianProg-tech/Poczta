import { describe, it, expect, beforeAll } from 'vitest';
import '../i18n/config';
import i18n from 'i18next';

describe('i18n configuration', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('pl');
  });

  it('translates navigation keys in Polish', () => {
    expect(i18n.t('nav.dashboard')).toBe('Panel główny');
    expect(i18n.t('nav.shipments')).toBe('Przesyłki');
    expect(i18n.t('nav.logout')).toBe('Wyloguj');
  });

  it('translates navigation keys in English', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('nav.dashboard')).toBe('Dashboard');
    expect(i18n.t('nav.shipments')).toBe('Shipments');
    expect(i18n.t('nav.logout')).toBe('Log out');
    await i18n.changeLanguage('pl');
  });

  it('translates common keys', () => {
    expect(i18n.t('common.loading')).toBe('Ładowanie...');
    expect(i18n.t('common.cancel')).toBe('Anuluj');
  });

  it('translates theme keys', () => {
    expect(i18n.t('theme.toggle')).toBe('Przełącz motyw');
  });

  it('translates language keys', () => {
    expect(i18n.t('language.pl')).toBe('Polski');
  });
});
