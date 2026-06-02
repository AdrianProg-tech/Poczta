import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginDemo from '../app/pages/LoginDemo';
import * as api from '../app/api';
import '../i18n/config';

const loginAsRole = vi.fn();

vi.mock('../app/state/AppStateContext', () => ({
  useAppStateContext: () => ({
    loginAsRole,
  }),
}));

vi.mock('../app/api', async () => {
  const actual = await vi.importActual<typeof import('../app/api')>('../app/api');
  return {
    ...actual,
    getDemoUsers: vi.fn(),
  };
});

describe('LoginDemo', () => {
  const getDemoUsersMock = vi.mocked(api.getDemoUsers);

  beforeEach(() => {
    loginAsRole.mockReset();
    getDemoUsersMock.mockReset();
    getDemoUsersMock.mockImplementation(async (group) => {
      switch (group) {
        case 'client':
          return [
            {
              email: 'jan.kowalski.client@example.com',
              displayName: 'Jan Kowalski',
              appRole: 'client',
              adminScope: null,
              pointCode: null,
              pointName: null,
              serviceCity: null,
            },
          ];
        case 'dispatcher':
          return [
            {
              email: 'ops.dispatch@example.com',
              displayName: 'Ola Dispatch',
              appRole: 'admin',
              adminScope: 'DISPATCHER',
              pointCode: null,
              pointName: null,
              serviceCity: null,
            },
          ];
        default:
          return [];
      }
    });
  });

  it('loads users for the selected role and refreshes when the role changes', async () => {
    render(
      <MemoryRouter>
        <LoginDemo />
      </MemoryRouter>,
    );

    await waitFor(() => expect(getDemoUsersMock).toHaveBeenCalledWith('client'));
    expect(screen.getByRole('option', { name: /Jan Kowalski/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Dispatcher/i }));

    await waitFor(() => expect(getDemoUsersMock).toHaveBeenLastCalledWith('dispatcher'));
    expect(screen.getByRole('option', { name: /Ola Dispatch/i })).toBeInTheDocument();
  });
});
