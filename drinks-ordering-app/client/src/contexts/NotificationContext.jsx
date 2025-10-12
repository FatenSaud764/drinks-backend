import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AxiosInstance from '../components/Axios.jsx';
import { useAuth } from './AuthContext.jsx';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationContext');
  }
  return context;
};

const fetchRecentOrders = async (since) => {
  try {
    const response = await AxiosInstance.get('/api/orders/recent/', {
      params: { since }
    });
    console.log('Recent orders response:', response);

    return response.data;
  } catch (error) {
    console.error('Failed to fetch recent orders:', error);
    return [];
  }
}

export const NotificationProvider = ({ children }) => {
  const { isLoggedIn, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const lastCheckedRef = useRef(null);
  const intervalRef = useRef(null);
  const previousOrdersRef = useRef(new Map());
  const isCheckingRef = useRef(false);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [...prev, { ...notification, id: Date.now() }]);
  }, []);

  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const checkForUpdates = useCallback(async () => {
  if (!isLoggedIn || !user) return;

  if (isCheckingRef.current) {
    console.log('Already checking');
    return;
  }

  isCheckingRef.current = true;

  try {
    const since = lastCheckedRef.current || new Date(Date.now() - 60000).toISOString();
    const recentOrders = await fetchRecentOrders(since);

    recentOrders.forEach(order => {
      const previousOrder = previousOrdersRef.current.get(order.id);

      // Only add notification if status actually changed
      if (previousOrder && previousOrder.status !== order.status) {
        addNotification({
          orderId: order.id,
          orderNumber: order.order_number || order.id,
          oldStatus: previousOrder?.status,
          newStatus: order?.status,
          timestamp: new Date()
        });
      }

      previousOrdersRef.current.set(order.id, {
        status: order?.status,
        updated_at: order.updated_at
      });
    });

    lastCheckedRef.current = new Date().toISOString();
  } catch (error) {
    console.error('Error checking for order updates', error);
  } finally {
    isCheckingRef.current = false;
  }
}, [isLoggedIn, user, addNotification]);

  useEffect(() => {
    if (isLoggedIn && user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      checkForUpdates();

      intervalRef.current = setInterval(checkForUpdates, 4000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      previousOrdersRef.current.clear();
      setNotifications([]);
      lastCheckedRef.current = null;
    }
  }, [isLoggedIn, user, checkForUpdates]);

  const value = {
    notifications,
    removeNotification,
    clearAllNotifications,
    checkForUpdates
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
};
