import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInventory } from '../hooks/useInventory';
import { useManagement } from '../hooks/useManagement';
import { useOrders, useOrder, useActiveOrders, useOrderHistory, useOrderOTP } from '../hooks/useOrders';
import { useOrderPolling } from '../hooks/usePolling';

// Mock APIs
vi.mock('../api/inventory', () => ({
  inventoryAPI: {
    fetchAllDrinks: vi.fn().mockResolvedValue([{ id: 1, name: 'Cola', price: 10 }]),
    createDrink: vi.fn().mockResolvedValue({ id: 2, name: 'Water', price: 5 }),
    updateDrink: vi.fn().mockResolvedValue({ id: 1, name: 'Cola+', price: 11 }),
    toggleAvailability: vi.fn().mockResolvedValue({ id: 1 }),
    deleteDrink: vi.fn().mockResolvedValue(true),
    updateGlobalLowStockLevel: vi.fn().mockResolvedValue({ ok: true }),
    updateGlobalUnavailableLevel: vi.fn().mockResolvedValue({ ok: true }),
    updateDrinkLowStockLevel: vi.fn().mockResolvedValue({ id: 1, low_stock_level: 3 }),
    updateDrinkUnavailableLevel: vi.fn().mockResolvedValue({ id: 1, unavailable_level: 0 })
  }
}));

vi.mock('../api/management', () => ({
  managementAPI: {
    fetchAllUsers: vi.fn().mockResolvedValue([{ id: 10, username: 'staff1', level: 'staff' }]),
    updateUserRole: vi.fn().mockResolvedValue({ id: 10, level: 'admin' }),
    registerUser: vi.fn().mockResolvedValue({ id: 11, username: 'new', level: 'staff' }),
    deleteUser: vi.fn().mockResolvedValue(true)
  }
}));

vi.mock('../api/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
vi.mock('../api/orders', () => ({
  ordersAPI: {
    fetchAllOrders: vi.fn().mockResolvedValue([{ id: 1, status: 'pending' }]),
    updateOrderStatus: vi.fn().mockResolvedValue({ id: 1, status: 'preparing' }),
    fetchOrder: vi.fn().mockResolvedValue({ id: 99, status: 'ready' }),
    fetchActiveOrders: vi.fn().mockResolvedValue([{ id: 1, status: 'pending' }]),
    fetchOrderHistory: vi.fn().mockResolvedValue([{ id: 2, status: 'completed' }]),
    verifyOrderOTP: vi.fn().mockResolvedValue({ ok: true }),
    fetchRecentOrders: vi.fn().mockResolvedValue([{ id: 201, status: 'pending' }])
  }
}));

describe('useInventory', () => {
  it('fetches and mutates inventory', async () => {
    const { result } = renderHook(() => useInventory());
    await waitFor(() => expect(result.current.drinks.length).toBe(1));
    await act(async () => { await result.current.createDrink({ name: 'Water' }); });
    expect(result.current.drinks.length).toBeGreaterThan(1);
    await act(async () => { await result.current.updateDrink(1, { name: 'Cola+' }); });
    await act(async () => { await result.current.toggleAvailability(1, true); });
    await act(async () => { await result.current.deleteDrink(2); });
    await act(async () => { await result.current.updateGlobalLowStockThreshold(5); });
    await act(async () => { await result.current.updateGlobalUnavailableThreshold(0); });
    await act(async () => { await result.current.updateDrinkLowStockThreshold(1, 3); });
    await act(async () => { await result.current.updateDrinkUnavailableThreshold(1, 0); });
  });
});

describe('useManagement', () => {
  it('fetches users and updates/promotes', async () => {
    const { result } = renderHook(() => useManagement());
    await waitFor(() => expect(result.current.users.length).toBe(1));
    await act(async () => { await result.current.updateUserRole(10, { level: 'admin' }); });
    await act(async () => { await result.current.promoteToAdmin(10); });
    await act(async () => { await result.current.demoteToStaff(10); });
    await act(async () => { await result.current.registerUser({ username: 'new', email: 'e', password: 'p' }); });
    await act(async () => { await result.current.deleteUser(11); });
  });
});

describe('useOrders aggregate', () => {
  it('fetches and updates orders', async () => {
    const { result } = renderHook(() => useOrders());
    await waitFor(() => expect(result.current.orders.length).toBe(1));
    await act(async () => { await result.current.updateOrderStatus(1, 'preparing'); });
  });
});

describe('useOrder single', () => {
  it('fetches single order and updates', async () => {
    const { result } = renderHook(() => useOrder(99));
    await waitFor(() => expect(result.current.order?.id).toBe(99));
    await act(async () => { await result.current.updateOrderStatus('completed'); });
  });
});

describe('useActiveOrders & useOrderHistory', () => {
  it('initially fetch lists', async () => {
    const active = renderHook(() => useActiveOrders());
    const history = renderHook(() => useOrderHistory());
    await waitFor(() => expect(active.result.current.orders.length).toBe(1));
    await waitFor(() => expect(history.result.current.orders.length).toBe(1));
  });
});

describe('useOrderOTP', () => {
  it('verifies otp successfully', async () => {
    const { result } = renderHook(() => useOrderOTP());
    await act(async () => { await result.current.verifyOTP(1, '1234'); });
    expect(result.current.verified).toBe(true);
  });
});

describe('useOrderPolling', () => {
  it('invokes onNewOrder callback', async () => {
    const cb = vi.fn();
    renderHook(() => useOrderPolling({ onNewOrder: cb, enabled: true, interval: 10 }));
    await waitFor(() => expect(cb).toHaveBeenCalled());
  });
});
