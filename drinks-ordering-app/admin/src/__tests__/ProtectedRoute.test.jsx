import { render, screen } from '@testing-library/react';
// ProtectedRoute will be imported after mocking auth each time
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock useAuth to control auth state
function mockAuth(state) {
  vi.resetModules();
  vi.doMock('../contexts/AuthContext', () => ({
    useAuth: () => state
  }));
}

describe('ProtectedRoute', () => {
  test('renders children immediately when authenticated (test env skips delay)', async () => {
    mockAuth({ isAuthenticated: true, loading: false });
    const { default: ProtectedRoute } = await import('../components/ProtectedRoute.jsx');
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="secret">Secret Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByTestId('secret')).toBeInTheDocument();
  });

  test('redirects (does not render children) when unauthenticated', async () => {
    mockAuth({ isAuthenticated: false, loading: false });
    const { default: ProtectedRoute } = await import('../components/ProtectedRoute.jsx');
    const { queryByTestId } = render(
      <MemoryRouter initialEntries={["/protected"]}>
        <ProtectedRoute>
          <div data-testid="secret">Secret Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(queryByTestId('secret')).toBeNull();
  });
});
