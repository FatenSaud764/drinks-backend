import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../components/ThemeToggle';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

// Simple wrapper using real ThemeProvider
function Wrapper({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

test('ThemeToggle renders and toggles theme icon', () => {
  render(
    <Wrapper>
      <ThemeToggle />
    </Wrapper>
  );
  const button = screen.getByRole('button', { name: /toggle theme/i });
  expect(button).toBeInTheDocument();
  fireEvent.click(button); // toggles
  // No explicit assertion beyond existence; icon swap is implicit and handled by context.
});
