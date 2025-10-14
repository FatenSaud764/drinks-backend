import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../components/Header';

function Wrapper({ children }) {
  // minimal wrapper to supply required props
  return children;
}

test('renders header and toggles sidebar', () => {
  const toggleSidebar = vi.fn();
  render(
    <Wrapper>
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={false} />
    </Wrapper>
  );

  expect(screen.getByRole('heading', { name: /swiftserve staff/i })).toBeInTheDocument();
  const button = screen.getByRole('button', { name: /toggle sidebar/i });
  fireEvent.click(button);
  expect(toggleSidebar).toHaveBeenCalledTimes(1);
});
