import { render, screen, fireEvent } from '@testing-library/react';
import ThemeButton from '../components/ThemeButton';
import { LightDark } from '../contexts/contexts';

function Provider({ children }) {
  const value = { theme: 'light', setTheme: vi.fn() };
  return (
    <LightDark.Provider value={value}>{children}</LightDark.Provider>
  );
}

test('renders ThemeButton and toggles theme', () => {
  render(
    <Provider>
      <ThemeButton />
    </Provider>
  );

  const button = screen.getByRole('button');
  expect(button).toBeInTheDocument();
  fireEvent.click(button);
});
