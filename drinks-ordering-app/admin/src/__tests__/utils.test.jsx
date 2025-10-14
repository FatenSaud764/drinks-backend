import { describe, test, expect, vi } from 'vitest';
import { normaliseOrder } from '../utils/normaliseOrder';
import {
  STATUS_FLOW,
  getCurrentStatusIndex,
  canMoveToPrevious,
  canMoveToNext,
  getPreviousStatus,
  getNextStatus,
  getStatusOptions,
  formatTime,
  formatDate,
  formatCurrency,
  filterOrdersByStatus,
  filterOrdersBySearch,
  filterOrdersByDate,
  getActiveOrderStatusCounts,
  getHistoryOrderStatusCounts,
  notifyClient,
  notifyClientReminder
} from '../utils/OrderUtils';

// Mock toast & ordersAPI (need named export ordersAPI and default)
vi.mock('react-toastify', async () => {
  return { toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } };
});
vi.mock('../api/orders.js', () => ({
  __esModule: true,
  ordersAPI: { sendPickupReminder: vi.fn().mockResolvedValue({ ok: true }) },
  default: { sendPickupReminder: vi.fn().mockResolvedValue({ ok: true }) }
}));

// Mock shared types
vi.mock('shared/types', () => ({
  ORDER_STATUSES: {
    PENDING: 'pending',
    PREPARING: 'preparing',
    READY: 'ready',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  }
}));

const ORDER_STATUSES = { PENDING: 'pending', PREPARING: 'preparing', READY: 'ready', COMPLETED: 'completed', CANCELLED: 'cancelled' };

describe('normaliseOrder', () => {
  test('normalises basic order shape', () => {
    const raw = {
      id: '5', user: 2, note: 'n', status: 'pending', total_price: '12.50',
      items: [{ id: 1 }], created_at: '2024-01-01T10:00:00Z', updated_at: '2024-01-01T10:05:00Z'
    };
    const norm = normaliseOrder(raw);
    expect(norm.id).toBe(5);
    expect(norm.totalAmount).toBe(12.50);
    expect(norm.orderNumber).toBe('#5');
    expect(norm.items.length).toBe(1);
  });
});

describe('Order status flow helpers', () => {
  test('status flow indices', () => {
    expect(getCurrentStatusIndex('pending')).toBe(0);
    expect(getCurrentStatusIndex('ready')).toBe(2);
  });
  test('canMoveToPrevious logic', () => {
    expect(canMoveToPrevious('pending')).toBe(false);
    expect(canMoveToPrevious('preparing')).toBe(false); // explicitly blocked
    expect(canMoveToPrevious('ready')).toBe(true);
  });
  test('canMoveToNext logic', () => {
    expect(canMoveToNext('pending')).toBe(true);
    expect(canMoveToNext('completed')).toBe(false);
  });
  test('previous/next status', () => {
    expect(getPreviousStatus('ready')).toBe('preparing');
    expect(getNextStatus('ready')).toBe('completed');
    expect(getPreviousStatus('pending')).toBeNull();
  });
  test('getStatusOptions returns expected options', () => {
    expect(getStatusOptions('pending')).toContain('cancelled');
    expect(getStatusOptions('ready')).toEqual([]);
  });
});

describe('Formatting', () => {
  const date = '2024-01-01T12:34:00Z';
  test('formatCurrency', () => {
    expect(formatCurrency(5)).toBe('R5.00');
  });
  test('formatTime/date produce strings', () => {
    expect(typeof formatTime(date)).toBe('string');
    expect(typeof formatDate(date)).toBe('string');
  });
});

describe('Filtering', () => {
  const orders = [
    { id: 1, status: 'pending', orderNumber: '#1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, status: 'preparing', orderNumber: '#2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, status: 'completed', orderNumber: '#3', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), customerName: 'Alice' },
  ];
  test('filterOrdersByStatus all vs specific', () => {
    expect(filterOrdersByStatus(orders, 'all').length).toBe(3);
    expect(filterOrdersByStatus(orders, 'pending').length).toBe(1);
  });
  test('filterOrdersBySearch matches order number or customer', () => {
    expect(filterOrdersBySearch(orders, '#2').length).toBe(1);
    expect(filterOrdersBySearch(orders, 'alice').length).toBe(1);
  });
  test('filterOrdersByDate today returns items', () => {
    expect(filterOrdersByDate(orders, 'today').length).toBeGreaterThan(0);
  });
  test('filterOrdersByDate other ranges', () => {
    expect(Array.isArray(filterOrdersByDate(orders, 'yesterday'))).toBe(true);
    expect(Array.isArray(filterOrdersByDate(orders, 'week'))).toBe(true);
    expect(Array.isArray(filterOrdersByDate(orders, 'month'))).toBe(true);
    expect(Array.isArray(filterOrdersByDate(orders, 'year'))).toBe(true);
  });
});

describe('Status counts', () => {
  const orders = [
    { status: 'pending' },
    { status: 'preparing' },
    { status: 'ready' },
    { status: 'completed' },
    { status: 'cancelled' }
  ];
  test('active order counts', () => {
    const counts = getActiveOrderStatusCounts(orders);
    expect(counts.pending).toBe(1);
    expect(counts.ready).toBe(1);
    expect(counts.all).toBe(3);
  });
  test('history counts', () => {
    const counts = getHistoryOrderStatusCounts(orders);
    expect(counts.completed).toBe(1);
    expect(counts.cancelled).toBe(1);
    expect(counts.all).toBe(5);
  });
});

describe('Notifications', () => {
  test('notifyClient calls toast', async () => {
    const { toast } = await import('react-toastify');
    notifyClient(10, 'ready');
    expect(toast.info).toHaveBeenCalledTimes(1);
  });
  test('notifyClientReminder uses API and success toast', async () => {
    const { toast } = await import('react-toastify');
    const mod = await import('../api/orders.js');
    await notifyClientReminder(12);
    // Either named or default export's spy should have been called
    const called = mod.ordersAPI?.sendPickupReminder?.mock.calls.length || mod.default.sendPickupReminder.mock.calls.length;
    expect(called).toBeGreaterThan(0);
    expect(toast.success).toHaveBeenCalled();
  });
});
