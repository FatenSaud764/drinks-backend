import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../components/Header';
import { ThemeProvider } from '../contexts/ThemeContext';

test('renders header and toggles sidebar', () => {
  const toggleSidebar = vi.fn();
  render(
    <ThemeProvider>
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={false} />
    </ThemeProvider>
  );

  expect(screen.getByRole('heading', { name: /swiftserve staff/i })).toBeInTheDocument();
  const button = screen.getByRole('button', { name: /toggle sidebar/i });
  fireEvent.click(button);
  expect(toggleSidebar).toHaveBeenCalledTimes(1);
});
