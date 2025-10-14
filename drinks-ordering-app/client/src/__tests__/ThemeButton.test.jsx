import { render, screen, fireEvent } from '@testing-library/react';
import ThemeButton from '../components/ThemeButton';
import { LightDark } from '../contexts/contexts';

test('ThemeButton calls setTheme on click', () => {
  const setTheme = vi.fn();
  render(
    <LightDark.Provider value={{ theme: 'light', setTheme }}>
      <ThemeButton />
    </LightDark.Provider>
  );
  const button = screen.getByRole('button');
  fireEvent.click(button);
  expect(setTheme).toHaveBeenCalledTimes(1);
});

