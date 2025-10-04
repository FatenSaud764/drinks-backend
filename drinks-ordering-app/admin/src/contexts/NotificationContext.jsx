import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useOrderPolling } from '../hooks/usePolling';

const NotificationMonitor = ({ isStaff = false }) => {
  const navigate = useNavigate();
  const notifiedOrders = useRef(new Set());

  const handleNewOrder = useCallback((order) => {
    // Prevent duplicate notifications
    if (notifiedOrders.current.has(order.id)) return;
    notifiedOrders.current.add(order.id);

    console.log('New order notification:', order);
    
    toast.info(
      <div 
        onClick={() => handleNotificationClick(order.id)} 
        style={{ cursor: 'pointer' }}
      >
        <strong>New Order Received!</strong>
        <p style={{ margin: '4px 0' }}>Order #{order.id}</p>
        <p style={{ margin: '4px 0', fontSize: '0.9em' }}>
          Total: R{order.total_price}
        </p>
      </div>,
      {
        autoClose: 10000,
        position: 'top-right',
        style: { background: '#1976d2', color: 'white' },
      }
    );
  }, []);

  useOrderPolling({
    onNewOrder: handleNewOrder,
    interval: 3000, // Check every 3 seconds
    enabled: isStaff // Only poll if staff
  });

  const handleNotificationClick = (orderId) => {
    navigate('/orders');
    setTimeout(() => scrollToOrder(orderId), 300);
  };

  const scrollToOrder = (orderId) => { // Might fix this once I decide if I want to...
    const element = document.getElementById(`order-${orderId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-pulse');
      setTimeout(() => element.classList.remove('highlight-pulse'), 2000);
    }
  };

  return null;
};

export default NotificationMonitor;