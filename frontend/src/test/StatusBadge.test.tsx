import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../i18n/config';
import i18n from 'i18next';
import { StatusBadge } from '../app/components/StatusBadge';

beforeAll(async () => {
  await i18n.changeLanguage('pl');
});

describe('StatusBadge', () => {
  it('renders label for DELIVERED shipment status', () => {
    render(<StatusBadge status="DELIVERED" type="shipment" />);
    expect(screen.getByText('Doręczona')).toBeInTheDocument();
  });

  it('renders label for CREATED shipment status', () => {
    render(<StatusBadge status="CREATED" type="shipment" />);
    expect(screen.getByText('Utworzona')).toBeInTheDocument();
  });

  it('renders label for PAID payment status', () => {
    render(<StatusBadge status="PAID" type="payment" />);
    expect(screen.getByText('Opłacona')).toBeInTheDocument();
  });

  it('renders label for PENDING payment status', () => {
    render(<StatusBadge status="PENDING" type="payment" />);
    expect(screen.getByText('Oczekująca')).toBeInTheDocument();
  });

  it('renders label for ACCEPTED complaint status', () => {
    render(<StatusBadge status="ACCEPTED" type="complaint" />);
    expect(screen.getByText('Uznana')).toBeInTheDocument();
  });

  it('renders Nieznany for null status', () => {
    render(<StatusBadge status={null} />);
    expect(screen.getByText('Nieznany')).toBeInTheDocument();
  });

  it('renders Nieznany for undefined status', () => {
    render(<StatusBadge status={undefined} />);
    expect(screen.getByText('Nieznany')).toBeInTheDocument();
  });

  it('renders raw status string for unknown status', () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />);
    expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument();
  });

  it('uses shipment type by default', () => {
    render(<StatusBadge status="IN_TRANSIT" />);
    expect(screen.getByText('W transporcie')).toBeInTheDocument();
  });

  it('renders OFFLINE_PENDING payment status', () => {
    render(<StatusBadge status="OFFLINE_PENDING" type="payment" />);
    expect(screen.getByText('Offline do potwierdzenia')).toBeInTheDocument();
  });

  it('renders AWAITING_PICKUP shipment status', () => {
    render(<StatusBadge status="AWAITING_PICKUP" type="shipment" />);
    expect(screen.getByText('Czeka na odbiór')).toBeInTheDocument();
  });

  it('renders correct label after language switch to EN', async () => {
    await i18n.changeLanguage('en');
    render(<StatusBadge status="DELIVERED" type="shipment" />);
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    await i18n.changeLanguage('pl');
  });

  it('renders SUBMITTED complaint status', () => {
    render(<StatusBadge status="SUBMITTED" type="complaint" />);
    expect(screen.getByText('Złożona')).toBeInTheDocument();
  });
});
