import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import DemoHelp from '../app/pages/DemoHelp';
import '../i18n/config';

describe('DemoHelp', () => {
  it('renders public scenario cards and glossary content', () => {
    render(
      <MemoryRouter>
        <DemoHelp />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Demo flow mental model/i)).toBeInTheDocument();
    expect(screen.getByText(/Client creates, point sends, courier delivers/i)).toBeInTheDocument();
    expect(screen.getByText(/Walk-in shipment at point/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick glossary/i)).toBeInTheDocument();
    expect(screen.getAllByText(/READY_FOR_HANDOVER/i).length).toBeGreaterThan(0);
  });
});
