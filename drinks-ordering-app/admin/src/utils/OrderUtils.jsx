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

// Will probably need to adjust infuture depending on what the order heading will be
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
export const notifyClient = (orderId, status) => {
  // Replace with actual notification system - API call
  toast.info(`Notification sent: Order ${orderId} is now ${status.toUpperCase()}`);
};

export const notifyClientReminder = (orderId) => {
  // Notify customer to collect their completed order
  toast.info(`Reminder sent: Order ${orderId} is ready for collection`);
};