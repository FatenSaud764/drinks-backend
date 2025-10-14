import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext.jsx';
import { SnackbarProvider, useSnackbar } from '../contexts/SnackbarContext.jsx';
// AuthContext & NotificationMonitor intentionally not tested per user request
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Mocks
vi.mock('../api/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
// auth api mock removed (not needed)

// polling mock removed (not needed)

// toastify mock removed (not needed)

// Helper components
const ThemeConsumer = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>{isDarkMode ? 'dark' : 'light'}</button>;
};

const SnackbarConsumer = () => {
  const { showSnackbar } = useSnackbar();
  return <button onClick={() => showSnackbar('Saved', 'success')}>show</button>;
};

// AuthConsumer removed

describe('ThemeContext', () => {
  it('toggles theme state', () => {
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toBe('light');
    fireEvent.click(btn);
    expect(btn.textContent).toBe('dark');
  });
});

describe('SnackbarContext', () => {
  it('shows snackbar message', () => {
    render(<SnackbarProvider><SnackbarConsumer /></SnackbarProvider>);
    fireEvent.click(screen.getByText('show'));
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });
});

// AuthContext & NotificationMonitor tests removed
