import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OTPModal from '../components/OTPModal.jsx';

// Mock hooks used inside OTPModal
vi.mock('../hooks/useOrders', () => ({
  useOrderOTP: () => ({
    loading: false,
    error: '',
    verifyOTP: vi.fn().mockResolvedValue(true),
    clearError: vi.fn(),
    resetVerification: vi.fn()
  })
}));

vi.mock('../hooks/useInventory', () => ({
  useInventory: () => ({ drinks: [{ id: 1, name: 'Cola', price: 10 }] })
}));

const sampleOrder = {
  id: 5,
  orderNumber: '#5',
  totalAmount: 15,
  items: [{ drink_id: 1, quantity: 1 }],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  status: 'ready'
};

describe('OTPModal', () => {
  it('renders and submits OTP for existing order (complete mode)', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<OTPModal open={true} onClose={onClose} onConfirm={onConfirm} order={sampleOrder} />);
    const pinInput = screen.getByLabelText(/Enter PIN/i);
    fireEvent.change(pinInput, { target: { value: '1234' } });
    const submitBtn = screen.getByRole('button', { name: /Confirm Completion/i });
    fireEvent.click(submitBtn);
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
  });

  it('find mode attempts order resolution', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<OTPModal open={true} onClose={onClose} onConfirm={onConfirm} mode="find" availableOrders={[sampleOrder]} />);
    const pinInput = screen.getByLabelText(/Enter PIN/i);
    fireEvent.change(pinInput, { target: { value: '9999' } });
    const submitBtn = screen.getByRole('button', { name: /Find & Complete/i });
    fireEvent.click(submitBtn);
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
  });
});
