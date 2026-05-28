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

  it('translates complaint action keys in Polish', () => {
    expect(i18n.t('complaints.startReview')).toBe('Rozpocznij weryfikację');
    expect(i18n.t('complaints.accept')).toBe('Przyjmij');
    expect(i18n.t('complaints.reject')).toBe('Odrzuć');
    expect(i18n.t('complaints.close')).toBe('Zamknij');
  });

  it('translates complaint action keys in English', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('complaints.startReview')).toBe('Start review');
    expect(i18n.t('complaints.accept')).toBe('Accept');
    expect(i18n.t('complaints.reject')).toBe('Reject');
    expect(i18n.t('complaints.close')).toBe('Close');
    await i18n.changeLanguage('pl');
  });

  it('translates auth keys in Polish', () => {
    expect(i18n.t('auth.loginError')).toBe('Nie udało się zalogować.');
    expect(i18n.t('auth.backToHome')).toBe('Wróć do strony głównej');
    expect(i18n.t('auth.demoNote')).toBe('Wersja demo podłączona do żywego backendu');
  });

  it('translates auth loginAs template with role interpolation', () => {
    expect(i18n.t('auth.loginAs', { role: 'Klient' })).toBe('Zaloguj jako Klient');
  });

  it('translates shipment status keys in Polish', () => {
    expect(i18n.t('status.shipment.DELIVERED')).toBe('Doręczona');
    expect(i18n.t('status.shipment.IN_TRANSIT')).toBe('W transporcie');
    expect(i18n.t('status.shipment.AWAITING_PICKUP')).toBe('Czeka na odbiór');
    expect(i18n.t('status.shipment.CANCELED')).toBe('Anulowana');
    expect(i18n.t('status.unknown')).toBe('Nieznany');
  });

  it('translates shipment status keys in English', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('status.shipment.DELIVERED')).toBe('Delivered');
    expect(i18n.t('status.shipment.IN_TRANSIT')).toBe('In transit');
    expect(i18n.t('status.shipment.AWAITING_PICKUP')).toBe('Awaiting pickup');
    expect(i18n.t('status.unknown')).toBe('Unknown');
    await i18n.changeLanguage('pl');
  });

  it('translates payment status keys', () => {
    expect(i18n.t('status.payment.PAID')).toBe('Opłacona');
    expect(i18n.t('status.payment.PENDING')).toBe('Oczekująca');
    expect(i18n.t('status.payment.OFFLINE_PENDING')).toBe('Offline do potwierdzenia');
    expect(i18n.t('status.payment.OFFLINE_CONFIRMED')).toBe('Offline potwierdzona');
  });

  it('translates complaint status keys', () => {
    expect(i18n.t('status.complaint.SUBMITTED')).toBe('Złożona');
    expect(i18n.t('status.complaint.IN_REVIEW')).toBe('W weryfikacji');
    expect(i18n.t('status.complaint.ACCEPTED')).toBe('Uznana');
    expect(i18n.t('status.complaint.REJECTED')).toBe('Odrzucona');
    expect(i18n.t('status.complaint.CLOSED')).toBe('Zamknięta');
  });

  it('translates nav profile key', () => {
    expect(i18n.t('nav.profile')).toBe('Mój profil');
  });

  it('translates point walkIn key', () => {
    expect(i18n.t('point.walkIn')).toBe('Klient walk-in');
  });
});
