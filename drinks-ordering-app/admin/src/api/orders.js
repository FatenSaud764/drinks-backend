/**
 * @author Kirsten Sanders
 * @description This is the API service for orders
*/

import api from "./api";

export const ordersAPI = {
  // Fetch all orders (staff can see all)
  fetchAllOrders: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add optional filters - will still update once I see what is needed
    if (filters.status) params.append('status', filters.status);
    if (filters.user_id) params.append('user_id', filters.user_id);

    // Fetch orders with filters
    try {
      const response = await api.get(`/api/orders/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch orders");
    }
  },

  // Fetch specific order details
  fetchOrder: async (orderId) => {
    try {
      const response = await api.get(`/api/orders/${orderId}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch order details");
    }
  },

  // Create new order - not needed on staff/admin side

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await api.patch(`/api/orders/${orderId}/status/`, {
        status: status
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update order status");
    }
  },

  // Get orders by status (for active orders page)
  fetchActiveOrders: async () => {
    try {
      const response = await api.get('/api/orders/?status=pending,preparing,ready');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch active orders");
    }
  },

  // Fetched completed/cancelled orders (for history page)
  fetchOrderHistory: async () => {
    try {
      const response = await api.get("/api/orders/?status=completed,cancelled");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch order history");
    }
  },

  // Restore cancelled order (change status back to pending)
  restoreOrder: async (orderId) => {
    try {
      const response = await api.patch(`api/orders/${orderId}/status/`, { status: "pending" });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to restore order");
    }
  },

  // Verify OTP to complete order (when customer provides OTP)
  verifyOrderOTP: async (orderId, otp) => {
    try {
      const response = await api.post(`/api/orders/${orderId}/otp/verify/`, {
        code: otp
      });
      return response.data;
    } catch (error) {
      const errData = error.response?.data;
      throw new Error(errData?.message || errData?.detail || "Failed to verify OTP");
    }
  },

  // Fetch recent orders for polling
  fetchRecentOrders: async (since) => {
    try {
      const response = await api.get('/api/orders/recent/', {
        params: { since }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recent orders:', error);
      return []; // Return empty array on error to prevent crashes
    }
  },
};
