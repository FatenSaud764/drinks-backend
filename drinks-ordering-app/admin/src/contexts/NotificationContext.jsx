/**
 * @description Real-time notification monitor using WebSocket
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../contexts/AuthContext'; // Assuming you have this

const NotificationMonitor = ({ isStaff = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user if available
  
  // Determine WebSocket URL
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/notifications/';

  const handleWebSocketMessage = useCallback((data) => {
    console.log('Received notification:', data);
    
    switch (data.type) {
      case 'connection_established':
        console.log('Connected to notification service');
        break;

      case 'authenticated':
        console.log('Authenticated as:', data.isStaff ? 'Staff' : 'Client', 'in group:', data.group);
        break;

      case 'new_order':
        if (isStaff) {
          showNewOrderNotification(data.order);
          playNotificationSound();
        }
        break;

      case 'order_update':
        showOrderUpdateNotification(data);
        break;

      default:
        console.log('Received message:', data);
    }
  }, [isStaff]);

  useWebSocket(wsUrl, {
    onMessage: handleWebSocketMessage,
    onConnect: () => console.log('WebSocket connected'),
    onDisconnect: () => console.log('WebSocket disconnected'),
    onError: (error) => console.error('WebSocket error:', error),
    isStaff: isStaff,
    userId: user?.id || null
  });

  const showNewOrderNotification = (order) => {
    toast.info(
      <div onClick={() => handleNotificationClick(order.id)} style={{ cursor: 'pointer' }}>
        <strong>New Order Received!</strong>
        <p style={{ margin: '4px 0' }}>Order {order.orderNumber || `#${order.id}`}</p>
        <small style={{ fontSize: '0.85em', opacity: 0.8 }}>Click to view details</small>
      </div>,
      {
        autoClose: 10000,
        position: 'top-right',
        style: { background: '#1976d2', color: 'white' },
        onClick: () => handleNotificationClick(order.id)
      }
    );
  };

  const showOrderUpdateNotification = (data) => {
    const statusMessages = {
      preparing: 'Order is being prepared',
      ready: 'Order is ready for pickup',
      completed: 'Order completed',
      cancelled: 'Order cancelled'
    };

    toast.info(
      <div onClick={() => handleNotificationClick(data.order_id)} style={{ cursor: 'pointer' }}>
        <strong>{statusMessages[data.status] || 'Order Updated'}</strong>
        <p style={{ margin: '4px 0' }}>Order #{data.order_id}</p>
      </div>,
      { autoClose: 5000, position: 'top-right' }
    );
  };

  const handleNotificationClick = (orderId) => {
    navigate('/orders');
    setTimeout(() => scrollToOrder(orderId), 300);
  };

  const scrollToOrder = (orderId) => {
    const element = document.getElementById(`order-${orderId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-pulse');
      setTimeout(() => element.classList.remove('highlight-pulse'), 2000);
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (error) {}
  };

  return null;
};

export default NotificationMonitor;