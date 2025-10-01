/**
 * @author Kirsten Sanders
 * @description This file contains utility functions for managing and manipulating order data.
*/

import { toast } from 'react-toastify';
import { ORDER_STATUSES } from 'shared/types';

/** Defines the valid order status flow (from pending to completed). */
export const STATUS_FLOW = [
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.READY,
  ORDER_STATUSES.COMPLETED
];

// ---------------- Status flow utilities ----------------
/** Get the index of a given status in the STATUS_FLOW array. */
export const getCurrentStatusIndex = (status) => {
  return STATUS_FLOW.indexOf(status);
};

/** Check if an order can move to the previous status. */
export const canMoveToPrevious = (status) => {
  const currentIndex = getCurrentStatusIndex(status);
  return currentIndex > 0 && status !== ORDER_STATUSES.CANCELLED && status !== ORDER_STATUSES.PREPARING;
};

/** Check if an order can move to the next status. */
export const canMoveToNext = (status) => {
  const currentIndex = getCurrentStatusIndex(status);
  return currentIndex < STATUS_FLOW.length - 1 && currentIndex !== -1 && status !== ORDER_STATUSES.CANCELLED;
};

/** Get the previoud status in the flow, if any */
export const getPreviousStatus = (status) => {
  const currentIndex = getCurrentStatusIndex(status);
  return currentIndex > 0 ? STATUS_FLOW[currentIndex - 1] : null;
};

/** Get the next status in the flow, if any */
export const getNextStatus = (status) => {
  const currentIndex = getCurrentStatusIndex(status);
  return currentIndex < STATUS_FLOW.length - 1 && currentIndex !== -1 ? STATUS_FLOW[currentIndex + 1] : null;
};

/** Get allowed status options (actions) for a given order status. */
export const getStatusOptions = (currentStatus) => {
  switch (currentStatus) {
    case ORDER_STATUSES.PENDING:
      // Pending orders can be cancelled
      return [ORDER_STATUSES.CANCELLED];
    
    case ORDER_STATUSES.PREPARING:
      // Preparing orders can move to ready
      return [ORDER_STATUSES.READY];
    
    case ORDER_STATUSES.READY:
      // Ready orders are completed via PIN modal, no direct button
      return [];
    
    case ORDER_STATUSES.COMPLETED:
    case ORDER_STATUSES.CANCELLED:
      // Terminal states - no actions available
      return [];
    
    default:
      return [];
  }
};

// ---------------- Formatting utilities ----------------
/** Format a date into a localized time string. */
export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/** Format a date into a localized date string. */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/** Format a numeric value into currency (Rand). */
export const formatCurrency = (amount) => {
  return `R${amount.toFixed(2)}`;
};

// ---------------- Order filtering utilities ----------------
/** Filter orders by status (all, pending, preparing, ready, completed, cancelled). */
export const filterOrdersByStatus = (orders, statusFilter) => {
  if (statusFilter === 'all') return orders;
  return orders.filter(order => order.status === statusFilter);
};

/** Filter orders by search term (order number). */
export const filterOrdersBySearch = (orders, searchTerm) => {
  if (!searchTerm) return orders;
  const searchLower = searchTerm.toLowerCase();
  
  return orders.filter(order => {
    // Check order number (handle both string and number IDs)
    const orderNumber = order.orderNumber || `#${order.id}`;
    const orderNumberMatch = orderNumber.toString().toLowerCase().includes(searchLower);
    
    // Check customer name safely
    const customerName = order.customerName || order.customer_name || '';
    const customerNameMatch = customerName && typeof customerName === 'string' 
      ? customerName.toLowerCase().includes(searchLower)
      : false;
    
    return orderNumberMatch || customerNameMatch;
  });
};

/** Filter orders by date (today, yesterday, week, or all). */
export const filterOrdersByDate = (orders, dateFilter) => {
  if (dateFilter === 'all') return orders;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const yearAgo = new Date(today);
  yearAgo.setDate(yearAgo.getDate() - 365);

  return orders.filter(order => {
    const orderDate = new Date(order.updated_at || order.created_at);
    if (isNaN(orderDate)) return false; // safeguard

    switch (dateFilter) {
      case 'today':
        return orderDate >= today;
      case 'yesterday':
        return orderDate >= yesterday && orderDate < today;
      case 'week':
        return orderDate >= weekAgo;
      case 'month':
        return orderDate >= monthAgo;
      case 'year':
        return orderDate >= yearAgo;
      default:
        return true;
    }
  });
};

// ---------------- Status count utilities ----------------
/**  Get counts of active orders (excluding completed and cancelled). */
export const getActiveOrderStatusCounts = (orders) => {
  // Only count active orders (not completed or cancelled)
  const activeOrders = orders.filter(order => 
    ![ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED].includes(order.status)
  );
  
  return {
    all: activeOrders.length,
    pending: activeOrders.filter(order => order.status === ORDER_STATUSES.PENDING).length,
    preparing: activeOrders.filter(order => order.status === ORDER_STATUSES.PREPARING).length,
    ready: activeOrders.filter(order => order.status === ORDER_STATUSES.READY).length,
  };
};

/**  Get counts of historical orders (completed and cancelled). */
export const getHistoryOrderStatusCounts = (orders) => {
  return {
    all: orders.length,
    completed: orders.filter(order => order.status === ORDER_STATUSES.COMPLETED).length,
    cancelled: orders.filter(order => order.status === ORDER_STATUSES.CANCELLED).length,
  };
};

// ---------------- Notification utilities ----------------
/** Notify a client about an order status update. */
export const notifyClient = (orderId, status) => {
  // Replace with actual notification system - API call (Message Passing)
  toast.info(`Notification sent: Order ${orderId} is now ${status.toUpperCase()}`);
};

/** Remind a client that their order is ready for collection. */
export const notifyClientReminder = (orderId) => {
  // Replace with actual notification system - API call (Message Passing)
  toast.info(`Reminder sent: Order ${orderId} is ready for collection`);
};