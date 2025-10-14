import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { LightDark } from '../contexts/contexts';
import React from 'react';

// Mock notification context
vi.mock('../contexts/NotificationContext.jsx', () => ({
  useNotifications: () => ({ notifications: [], removeNotification: vi.fn() })
}));

// Mock auth context
vi.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { username: 'tester' },
    accessToken: 'a',
    refreshToken: 'b',
    isLoggedIn: true,
    login: vi.fn(),
    logout: vi.fn(),
  })
}));

describe('NavBar', () => {
  test('renders brand and navigation links', () => {
    render(
      <MemoryRouter>
        <LightDark.Provider value={{ theme: 'light', setTheme: () => {} }}>
          <NavBar />
        </LightDark.Provider>
      </MemoryRouter>
    );
    expect(screen.getByText(/swiftserve/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
  });
});
