import { useState, useEffect, useRef } from 'react';
import { ordersAPI } from '../api/orders';

export const useOrderPolling = (options = {}) => {
  const {
    onNewOrder,
    interval = 3000,
    enabled = true
  } = options;

  const [lastCheck, setLastCheck] = useState(new Date().toISOString());
  const knownOrderIds = useRef(new Set());
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const pollOrders = async () => {
      try {
        const orders = await ordersAPI.fetchRecentOrders(lastCheck);
        
        if (!Array.isArray(orders) || orders.length === 0) {
          setLastCheck(new Date().toISOString());
          return;
        }

        // Only care about NEW pending orders
        orders.forEach(order => {
          if (!knownOrderIds.current.has(order.id) && order.status === 'pending') {
            console.log('New pending order detected:', order.id);
            knownOrderIds.current.add(order.id);
            onNewOrder?.(order);
          } else if (!knownOrderIds.current.has(order.id)) {
            // Track non-pending orders silently (so we don't notify about them later)
            knownOrderIds.current.add(order.id);
          }
        });

        setLastCheck(new Date().toISOString());

      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    pollOrders();
    intervalRef.current = setInterval(pollOrders, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, lastCheck, onNewOrder]);

  return { lastCheck };
};