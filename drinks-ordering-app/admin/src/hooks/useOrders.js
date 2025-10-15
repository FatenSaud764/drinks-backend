/**
 * @author Kirsten Sanders
 * @description This is a hook that manages orders with polling functionality
*/

import { useState, useEffect, useCallback, useRef } from 'react';
import { ordersAPI } from '../api/orders';

// ===================================================
// Main orders hook with comprehensive functionality
// ===================================================
export const useOrders = (filters = {}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = JSON.stringify(filters);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersAPI.fetchAllOrders(filters);
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Update order status (staff only)
  const updateOrderStatus = async (orderId, status) => {
    try {
      setError(null);
      const updatedOrder = await ordersAPI.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, ...updatedOrder } : order
      ));
      return updatedOrder;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Clear error
  const clearError = () => setError(null);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    updateOrderStatus,
    clearError
  };
};

// ===================================================
// Hook for single order details
// ===================================================
export const useOrder = (orderId) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await ordersAPI.fetchOrder(orderId);
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Update order status (for staff actions)
  const updateOrderStatus = async (status) => {
    if (!orderId) return;
    
    try {
      setError(null);
      const updatedOrder = await ordersAPI.updateOrderStatus(orderId, status);
      setOrder(prev => ({ ...prev, ...updatedOrder }));
      return updatedOrder;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return {
    order,
    loading,
    error,
    refetch: fetchOrder,
    updateOrderStatus,
    clearError
  };
};

// ===================================================
// Hook for ACTIVE orders (pending, preparing, ready) with polling
// ===================================================
export const useActiveOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchActiveOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await ordersAPI.fetchActiveOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchActiveOrders();

    // Set up polling every 2 seconds
    intervalRef.current = setInterval(() => {
      fetchActiveOrders(false); // Don't show loading for background polls
    }, 5000);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchActiveOrders]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      setError(null);
      const updatedOrder = await ordersAPI.updateOrderStatus(orderId, status);
      
      // If order is no longer active, remove it from the list
      if (['completed', 'cancelled'].includes(status)) {
        setOrders(prev => prev.filter(order => order.id !== orderId));
      } else {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, ...updatedOrder } : order
        ));
      }
      
      return updatedOrder;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return {
    orders,
    loading,
    error,
    refetch: () => fetchActiveOrders(true), // Manual refresh shows loading
    updateOrderStatus,
    clearError
  };
};

// ===================================================
// Hook for HISTORY orders (completed/cancelled orders) with polling
// ===================================================
export const useOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchOrderHistory = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await ordersAPI.fetchOrderHistory();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchOrderHistory();

    // Set up polling every 2 seconds
    intervalRef.current = setInterval(() => {
      fetchOrderHistory(false); // Don't show loading for background polls
    }, 8000);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchOrderHistory]);

  const clearError = () => setError(null);

  return {
    orders,
    loading,
    error,
    refetch: () => fetchOrderHistory(true), // Manual refresh shows loading
    clearError
  };
};

// ===================================================
// Hook for OTP verification
// ===================================================
export const useOrderOTP = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(false);

  const verifyOTP = async (orderId, otp) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ordersAPI.verifyOrderOTP(orderId, otp);
      setVerified(true);
      return result;
    } catch (err) {
      setError(err.message);
      setVerified(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);
  const resetVerification = () => {
    setVerified(false);
    setError(null);
  };

  return {
    loading,
    error,
    verified,
    verifyOTP,
    clearError,
    resetVerification
  };
};