import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import SignUp from '../components/SignUp.jsx';
import { LightDark, SignUpModal } from '../contexts/contexts.jsx';

// Mock Axios instance used inside SignUp
vi.mock('../components/Axios', () => ({
  default: { post: vi.fn().mockResolvedValue({ data: {} }) }
}));
import AxiosInstance from '../components/Axios';

describe('SignUp', () => {
  let setSignUpModal;
  beforeEach(() => {
    setSignUpModal = vi.fn();
    global.alert = vi.fn();
  });

  function Wrapper({ children }) {
    return (
      <LightDark.Provider value={{ theme: 'light', setTheme: () => {} }}>
        <SignUpModal.Provider value={{ signupmodal: true, setSignUpModal }}>
          {children}
        </SignUpModal.Provider>
      </LightDark.Provider>
    );
  }

  it('submits successfully with matching passwords', async () => {
    render(<Wrapper><SignUp /></Wrapper>);
    const usernameInput = document.querySelector('input[name="username"]');
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInputs = document.querySelectorAll('input[name="password"]');
    fireEvent.change(usernameInput, { target: { value: 'alice' } });
    fireEvent.change(emailInput, { target: { value: 'a@example.com' } });
    fireEvent.change(passwordInputs[0], { target: { value: 'pass1234' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /signup/i }));
    await waitFor(() => expect(AxiosInstance.post).toHaveBeenCalled());
  });

  it('alerts on mismatched passwords', () => {
    render(<Wrapper><SignUp /></Wrapper>);
    const usernameInput = document.querySelector('input[name="username"]');
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInputs = document.querySelectorAll('input[name="password"]');
    fireEvent.change(usernameInput, { target: { value: 'bob' } });
    fireEvent.change(emailInput, { target: { value: 'b@example.com' } });
    fireEvent.change(passwordInputs[0], { target: { value: 'one' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'two' } });
    fireEvent.click(screen.getByRole('button', { name: /signup/i }));
    expect(global.alert).toHaveBeenCalled();
  });
});
