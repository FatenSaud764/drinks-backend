import { toast } from 'react-toastify';
import { ORDER_STATUSES, notifyClient } from '../utils/OrderUtils';

// Base mock data
const BASE_MOCK_ORDERS = [
  {
    id: 1,
    orderNumber: 'ORD-001',
    items: [
      { name: 'Pina Colada', quantity: 2, price: 75.00 },
      { name: 'Black Label', quantity: 1, price: 40.00 }
    ],
    totalAmount: 190,
    status: ORDER_STATUSES.PENDING,
    orderTime: new Date('2024-08-08T09:30:00'),
    lastUpdated: new Date('2024-08-08T09:30:00'),
  },
  {
    id: 2,
    orderNumber: 'ORD-002',
    items: [
      { name: 'Castle Lager', quantity: 1, price: 38.50 },
    ],
    totalAmount: 38.50,
    status: ORDER_STATUSES.PREPARING,
    orderTime: new Date('2024-08-08T10:15:00'),
    lastUpdated: new Date('2024-08-08T10:45:00'),
  },
  {
    id: 3,
    orderNumber: 'ORD-003',
    items: [
      { name: 'Espresso Martini', quantity: 3, price: 85.50 },
    ],
    totalAmount: 256.50,
    status: ORDER_STATUSES.READY,
    orderTime: new Date('2024-08-08T11:00:00'),
    lastUpdated: new Date('2024-08-08T11:30:00'),
  },
  {
    id: 5,
    orderNumber: 'ORD-005',
    items: [
      { name: 'Whiskey Sour', quantity: 2, price: 92.00 },
      { name: 'Aperol Spritz', quantity: 1, price: 68.00 }
    ],
    totalAmount: 252.00,
    status: ORDER_STATUSES.PREPARING,
    orderTime: new Date('2024-08-08T11:30:00'),
    lastUpdated: new Date('2024-08-08T11:45:00'),
  },
  {
    id: 6,
    orderNumber: 'ORD-006',
    items: [
      { name: 'Red Wine Glass', quantity: 2, price: 55.00 }
    ],
    totalAmount: 110.00,
    status: ORDER_STATUSES.READY,
    orderTime: new Date('2024-08-08T12:00:00'),
    lastUpdated: new Date('2024-08-08T12:15:00'),
  },
  {
    id: 7,
    orderNumber: 'ORD-007',
    items: [
      { name: 'Mojito', quantity: 3, price: 72.00 },
      { name: 'Gin & Tonic', quantity: 2, price: 58.00 }
    ],
    totalAmount: 332.00,
    status: ORDER_STATUSES.PENDING,
    orderTime: new Date('2024-08-08T12:30:00'),
    lastUpdated: new Date('2024-08-08T12:30:00'),
  },
  {
    id: 8,
    orderNumber: 'ORD-008',
    items: [
      { name: 'Beer Flight', quantity: 1, price: 120.00 }
    ],
    totalAmount: 120.00,
    status: ORDER_STATUSES.PREPARING,
    orderTime: new Date('2024-08-08T13:00:00'),
    lastUpdated: new Date('2024-08-08T13:10:00'),
  }
];

// OTP Validation Function - will change when backend is implemented
export const validateCompletionPIN = (pin) => {  
  if (!pin || pin.trim() === '') {
    return false;
  }
  
  // For now, accept these PINs:
  // - "0" as a general demo PIN
  // - Last digit of order number (e.g., "3" for ORD-003, "5" for ORD-005)
  const validPins = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  return validPins.includes(pin.trim());
};

// Alternative function for more specific PIN validation per order
export const validateOrderPIN = (pin, orderNumber) => {
  // Extract last digit from order number for demo
  const orderDigit = orderNumber.slice(-1);
  
  // Accept either the order-specific PIN or the general demo PIN "0"
  return pin === orderDigit || pin === '0';
};

// Get active orders, excluding those moved to history
export const getMockActiveOrders = () => {
  // Get stored active orders or use base mock data
  const storedActiveOrders = JSON.parse(localStorage.getItem('activeOrders') || 'null');
  
  if (storedActiveOrders) {
    return storedActiveOrders;
  }
  
  // First time load - filter out any orders that are already in history
  const historyOrders = JSON.parse(localStorage.getItem('orderHistory') || '[]');
  const historyIds = historyOrders.map(order => order.id);
  
  const activeOrders = BASE_MOCK_ORDERS.filter(order => !historyIds.includes(order.id));
  
  // Store active orders
  localStorage.setItem('activeOrders', JSON.stringify(activeOrders));
  
  return activeOrders;
};

// Save active orders to localStorage
export const saveActiveOrders = (orders) => {
  localStorage.setItem('activeOrders', JSON.stringify(orders));
};

export const getMockHistoryOrders = () => {
  return [
    {
      id: 4,
      orderNumber: 'ORD-004',
      items: [
        { name: 'Coke', quantity: 1, price: 18.90 }
      ],
      totalAmount: 18.90,
      status: ORDER_STATUSES.COMPLETED,
      orderTime: new Date('2024-08-08T08:45:00'),
      lastUpdated: new Date('2024-08-08T09:00:00'),
      completedAt: new Date('2024-08-08T09:00:00'),
    },
    {
      id: 9,
      orderNumber: 'ORD-009',
      items: [
        { name: 'Margarita', quantity: 2, price: 78.00 }
      ],
      totalAmount: 156.00,
      status: ORDER_STATUSES.CANCELLED,
      orderTime: new Date('2024-08-07T14:30:00'),
      lastUpdated: new Date('2024-08-07T14:45:00'),
      cancelledAt: new Date('2024-08-07T14:45:00'),
    },
    {
      id: 10,
      orderNumber: 'ORD-010',
      items: [
        { name: 'Craft Beer', quantity: 3, price: 45.00 },
        { name: 'Nachos', quantity: 1, price: 85.00 }
      ],
      totalAmount: 220.00,
      status: ORDER_STATUSES.COMPLETED,
      orderTime: new Date('2024-08-07T16:15:00'),
      lastUpdated: new Date('2024-08-07T17:00:00'),
      completedAt: new Date('2024-08-07T17:00:00'),
    }
  ];
};

// Order management functions
export const updateOrderStatus = (orders, setOrders, orderId, newStatus) => {
  const order = orders.find(o => o.id === orderId);

  // Create the updated order
  const updatedOrder = { 
    ...order, 
    status: newStatus, 
    lastUpdated: new Date(),
    ...(newStatus === ORDER_STATUSES.COMPLETED && { completedAt: new Date() }),
    ...(newStatus === ORDER_STATUSES.CANCELLED && { cancelledAt: new Date() })
  };

  // If moving to completed or cancelled, remove from active orders and send to history
  if ([ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED].includes(newStatus)) {
    // Remove from active orders
    const updatedOrders = orders.filter(o => o.id !== orderId);
    setOrders(updatedOrders);
    
    // Save updated active orders to localStorage
    saveActiveOrders(updatedOrders);
    
    // Move to history
    moveToHistory(updatedOrder);
  } else {
    // For other status updates, just update the order in place
    const updatedOrders = orders.map(o => o.id === orderId ? updatedOrder : o);
    setOrders(updatedOrders);
    
    // Save updated active orders to localStorage
    saveActiveOrders(updatedOrders);
  }

  // Show confirmation toast and send notification
  toast.success(`${order.orderNumber} updated to ${newStatus.toUpperCase()}`);
  notifyClient(order, newStatus);

  return updatedOrder;
};

export const moveToHistory = (order) => {
  // This function will handle moving orders to history
  // In a real app, this would be an API call to update the order status in the backend
  // The history page would fetch these orders from the backend when implemented
  
  console.log('Moving order to history:', order);
  
  // For now, we'll store in localStorage to simulate backend persistence
  // In production, replace this with an API call
  const existingHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
  const updatedHistory = [order, ...existingHistory];
  localStorage.setItem('orderHistory', JSON.stringify(updatedHistory));
  
  toast.info(`${order.orderNumber} moved to order history`);
};

export const getOrderHistory = () => {
  // Get orders from localStorage (moved from active orders)
  const storedHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
  
  // Combine mock data with stored history
  const allHistoryOrders = [...storedHistory, ...getMockHistoryOrders()];
  
  // Sort by most recent first
  return allHistoryOrders.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
};

export const clearOrderHistory = (setHistoryOrders) => {
  if (window.confirm('Are you sure you want to clear all order history? This action cannot be undone.')) {
    localStorage.removeItem('orderHistory');
    setHistoryOrders(getMockHistoryOrders()); // Keep mock data
    toast.success('Order history cleared');
    return true;
  }
  return false;
};

export const restoreOrder = (historyOrders, setHistoryOrders, orderId) => {
  // This would typically be an API call to restore an order
  const order = historyOrders.find(o => o.id === orderId);
  if (order && order.status === ORDER_STATUSES.CANCELLED) {
    // Move back to active orders with pending status
    const restoredOrder = {
      ...order,
      status: ORDER_STATUSES.PENDING,
      lastUpdated: new Date()
    };
    
    // Remove from history (both localStorage and state)
    const updatedHistory = historyOrders.filter(o => o.id !== orderId);
    setHistoryOrders(updatedHistory);
    
    // Update localStorage history
    const storedHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    const updatedStoredHistory = storedHistory.filter(o => o.id !== orderId);
    localStorage.setItem('orderHistory', JSON.stringify(updatedStoredHistory));
    
    // Add back to active orders
    const currentActiveOrders = JSON.parse(localStorage.getItem('activeOrders') || '[]');
    const updatedActiveOrders = [restoredOrder, ...currentActiveOrders];
    localStorage.setItem('activeOrders', JSON.stringify(updatedActiveOrders));
    
    // In a real app, this would be an API call to move the order back to active
    toast.success(`${order.orderNumber} restored to active orders`);
    return restoredOrder;
  }
  return null;
};