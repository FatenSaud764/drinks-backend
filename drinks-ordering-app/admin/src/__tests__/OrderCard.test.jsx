import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OrderCard from '../components/OrderCard.jsx';
import * as OrderUtils from '../utils/OrderUtils';

// Spy on notifyClientReminder to avoid real side effects
vi.spyOn(OrderUtils, 'notifyClientReminder').mockImplementation(() => {});

const baseOrder = {
  id: 10,
  orderNumber: '#10',
  status: 'pending',
  orderTime: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  totalAmount: 25.5,
  items: [
    { drink_id: 1, quantity: 2 },
    { drink_id: 2, quantity: 1 }
  ],
  note: 'No ice'
};

const drinks = [
  { id: 1, name: 'Cola', price: 10 },
  { id: 2, name: 'Water', price: 5.5 }
];

describe('OrderCard Active', () => {
  it('renders order info and items, allows advancing to preparing', () => {
    const onUpdateStatus = vi.fn();
    render(<OrderCard order={baseOrder} onUpdateStatus={onUpdateStatus} drinks={drinks} />);
    expect(screen.getByText('#10')).toBeInTheDocument();
    expect(screen.getByText(/No ice/)).toBeInTheDocument();
    expect(screen.getByText(/Cola/)).toBeInTheDocument();
    // Previous disabled for pending
    const prevBtn = screen.getByRole('button', { name: /Previous/i });
    expect(prevBtn).toBeDisabled();
    // Next button shows target status name (Preparing ›)
    const nextBtn = screen.getByRole('button', { name: /Preparing/i });
    fireEvent.click(nextBtn);
    expect(onUpdateStatus).toHaveBeenCalledWith(10, 'preparing');
  });

  it('shows cancel action for pending (Mark as Cancelled)', () => {
    const onUpdateStatus = vi.fn();
    render(<OrderCard order={baseOrder} onUpdateStatus={onUpdateStatus} drinks={drinks} />);
    const cancelBtn = screen.getByRole('button', { name: /Mark as Cancelled/i });
    fireEvent.click(cancelBtn);
    expect(onUpdateStatus).toHaveBeenCalledWith(10, 'cancelled');
  });

  it('shows remind button when status ready', () => {
    const onUpdateStatus = vi.fn();
    const readyOrder = { ...baseOrder, status: 'ready' };
    render(<OrderCard order={readyOrder} onUpdateStatus={onUpdateStatus} drinks={drinks} />);
    const remindBtn = screen.getByRole('button', { name: /Remind Customer/i });
    fireEvent.click(remindBtn);
    expect(OrderUtils.notifyClientReminder).toHaveBeenCalled();
  });
});

describe('OrderCard History', () => {
  it('renders history details and date', () => {
    const onUpdateStatus = vi.fn();
    const histOrder = { ...baseOrder, status: 'completed' };
    render(<OrderCard order={histOrder} onUpdateStatus={onUpdateStatus} drinks={drinks} isHistory />);
    expect(screen.getByText(/Completed:/i)).toBeInTheDocument();
  });
});
