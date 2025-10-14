import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Notification from '../components/Notification.jsx';
import { MemoryRouter } from 'react-router-dom';

describe('Notification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('auto closes after interval', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <Notification isDisplaying={true} onClose={onClose} orderStatus="preparing" orderNumber={42} />
      </MemoryRouter>
    );
    // advance just over 2500ms
    vi.advanceTimersByTime(2600);
    expect(onClose).toHaveBeenCalled();
    expect(screen.getByText(/Order #42/i)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <Notification isDisplaying={true} onClose={onClose} orderStatus="pending" orderNumber={7} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /close notification/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
