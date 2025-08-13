import { toast } from 'react-toastify';

// Order status constants and flows
export const ORDER_STATUSES = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const STATUS_FLOW = [
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.READY,
  ORDER_STATUSES.COMPLETED
];

// Status flow utilities
export const getCurrentStatusIndex = (status) => {
  return STATUS_FLOW.indexOf(status);
};

export const canMoveToPrevious = (status) => {
  const currentIndex = getCurrentStatusIndex(status);
  return currentIndex > 0 && status !== ORDER_STATUSES.CANCELLED;
};

export const canMoveToNext = (status) => {
  const currentIndex = getCurrentStatusIndex(status);
  return currentIndex < STATUS_FLOW.length - 1 && currentIndex !== -1 && status !== ORDER_STATUSES.CANCELLED;
};

export const getPreviousStatus = (status) => {
  const currentIndex = getCurrentStatusIndex(status);
  return currentIndex > 0 ? STATUS_FLOW[currentIndex - 1] : null;
};

export const getNextStatus = (status) => {
  const currentIndex = getCurrentStatusIndex(status);
  return currentIndex < STATUS_FLOW.length - 1 && currentIndex !== -1 ? STATUS_FLOW[currentIndex + 1] : null;
};

export const getStatusOptions = (currentStatus) => {
  // Keep cancel option available for pending and preparing orders
  const cancelOptions = [ORDER_STATUSES.PENDING, ORDER_STATUSES.PREPARING].includes(currentStatus) 
    ? [ORDER_STATUSES.CANCELLED] 
    : [];
  return cancelOptions;
};

// Formatting utilities
export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatCurrency = (amount) => {
  return `R${amount.toFixed(2)}`;
};

// Order filtering utilities
export const filterOrdersByStatus = (orders, statusFilter) => {
  if (statusFilter === 'all') return orders;
  return orders.filter(order => order.status === statusFilter);
};

export const filterOrdersBySearch = (orders, searchTerm) => {
  if (!searchTerm) return orders;
  return orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );
};

export const filterOrdersByDate = (orders, dateFilter) => {
  if (dateFilter === 'all') return orders;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  return orders.filter(order => {
    const orderDate = new Date(order.lastUpdated);
    switch(dateFilter) {
      case 'today':
        return orderDate >= today;
      case 'yesterday':
        return orderDate >= yesterday && orderDate < today;
      case 'week':
        return orderDate >= weekAgo;
      default:
        return true;
    }
  });
};

// Status count utilities
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

export const getHistoryOrderStatusCounts = (orders) => {
  return {
    all: orders.length,
    completed: orders.filter(order => order.status === ORDER_STATUSES.COMPLETED).length,
    cancelled: orders.filter(order => order.status === ORDER_STATUSES.CANCELLED).length,
  };
};

// Notification utilities
export const notifyClient = (order, status) => {
  // Replace with actual notification system - API call
  toast.success(`Notification sent: Order ${order?.orderNumber} is now ${status.toUpperCase()}`);
};

export const notifyCustomer = (order) => {
  // Notify customer to collect their completed order
  toast.success(`Reminder sent: ${order?.orderNumber} is ready for collection`);
};