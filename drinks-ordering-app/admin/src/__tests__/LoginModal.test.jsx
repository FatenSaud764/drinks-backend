import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginModal from '../components/LoginModal.jsx';

describe('LoginModal', () => {
  let onClose, onLogin;

  beforeEach(() => {
    onClose = vi.fn();
    onLogin = vi.fn().mockResolvedValue({ ok: true });
  });

  const setup = () => {
    render(<LoginModal isOpen={true} onClose={onClose} onLogin={onLogin} />);
  };

  it('renders when open and can close via Cancel', () => {
    setup();
    expect(screen.getByText(/Admin Login/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('updates form fields and toggles password visibility', () => {
    setup();
    const userInput = screen.getByPlaceholderText(/Enter your username/i);
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    fireEvent.change(userInput, { target: { value: 'alice' } });
    fireEvent.change(emailInput, { target: { value: 'alice@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret' } });
    expect(userInput.value).toBe('alice');
    expect(emailInput.value).toBe('alice@example.com');
    expect(passwordInput.value).toBe('secret');
    // Toggle password visibility (query by class since icon button has no label)
    const toggleBtn = document.querySelector('.password-toggle');
    fireEvent.click(toggleBtn);
    // After toggle, type attribute should become text
    expect(screen.getByPlaceholderText(/Enter your password/i).getAttribute('type')).toBe('text');
  });

  it('does not submit when password missing', async () => {
    window.alert = vi.fn();
    setup();
    const userInput = screen.getByPlaceholderText(/Enter your username/i);
    fireEvent.change(userInput, { target: { value: 'onlyuser' } });
    const submitBtn = screen.getByRole('button', { name: /Login/i });
    fireEvent.click(submitBtn);
    await waitFor(() => expect(onLogin).not.toHaveBeenCalled());
  });

  it('submits with username & password and closes', async () => {
    setup();
    const userInput = screen.getByPlaceholderText(/Enter your username/i);
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    fireEvent.change(userInput, { target: { value: 'bob' } });
    fireEvent.change(emailInput, { target: { value: 'bob@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'pw123' } });
    const form = document.querySelector('form.login-form');
    fireEvent.submit(form);
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith({ username: 'bob', password: 'pw123' }));
    expect(onClose).toHaveBeenCalled();
  });
});
