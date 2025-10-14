import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterControls from '../components/FilterControls.jsx';

const baseCounts = { all: 3, pending: 1, preparing: 1, ready: 1 };
const statusOptions = ['pending', 'preparing', 'ready'];

describe('FilterControls', () => {
  const setup = (props = {}) => {
    const setSearchTerm = vi.fn();
    const setStatusFilter = vi.fn();
    const setDateFilter = vi.fn();
    render(
      <FilterControls
        searchTerm=""
        setSearchTerm={setSearchTerm}
        statusFilter={props.statusFilter || 'pending'}
        setStatusFilter={setStatusFilter}
        statusCounts={baseCounts}
        statusOptions={statusOptions}
        dateFilter={props.dateFilter || 'all'}
        setDateFilter={setDateFilter}
        showDateFilter={props.showDateFilter || false}
      />
    );
    return { setSearchTerm, setStatusFilter, setDateFilter };
  };

  it('renders status buttons with counts', () => {
    setup();
    statusOptions.forEach(opt => {
      expect(screen.getByRole('button', { name: new RegExp(opt, 'i') })).toBeInTheDocument();
    });
  });

  it('invokes setSearchTerm when typing', () => {
    const { setSearchTerm } = setup();
    const input = screen.getByPlaceholderText(/search by order number/i);
    fireEvent.change(input, { target: { value: '#5' } });
    expect(setSearchTerm).toHaveBeenCalledWith('#5');
  });

  it('changes status filter when clicking tab', () => {
    const { setStatusFilter } = setup();
    const prepBtn = screen.getByRole('button', { name: /Preparing/i });
    fireEvent.click(prepBtn);
    expect(setStatusFilter).toHaveBeenCalledWith('preparing');
  });

  it('updates date filter when select changes', () => {
    const { setDateFilter } = setup({ showDateFilter: true });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'today' } });
    expect(setDateFilter).toHaveBeenCalledWith('today');
  });
});
