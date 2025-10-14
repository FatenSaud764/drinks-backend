import { render, screen } from '@testing-library/react';
import Sidebar from '../components/Sidebar';
import { MemoryRouter } from 'react-router-dom';

describe('Sidebar', () => {
  afterEach(() => {
    vi.resetModules();
  });

  test('shows base navigation items when not authenticated', async () => {
    vi.resetModules();
    vi.doMock('../contexts/AuthContext', () => ({
      useAuth: () => ({
        isAuthenticated: false,
        user: null,
        loading: false,
        login: vi.fn(),
        logout: vi.fn()
      })
    }));
    const { default: SidebarMod } = await import('../components/Sidebar');
    render(
      <MemoryRouter>
        <SidebarMod isOpen={true} isMobile={false} onClose={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByText(/orders/i)).toBeInTheDocument();
    expect(screen.getByText(/history/i)).toBeInTheDocument();
    expect(screen.getByText(/inventory/i)).toBeInTheDocument();
    expect(screen.queryByText(/user management/i)).toBeNull();
  });

  test('shows admin link for admin user', async () => {
    vi.resetModules();
    vi.doMock('../contexts/AuthContext', () => ({
      useAuth: () => ({
        isAuthenticated: true,
        user: { username: 'admin', is_admin: true },
        loading: false,
        login: vi.fn(),
        logout: vi.fn()
      })
    }));
    const { default: SidebarMod } = await import('../components/Sidebar');
    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <SidebarMod isOpen={true} isMobile={false} onClose={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByText(/user management/i)).toBeInTheDocument();
  });
});
