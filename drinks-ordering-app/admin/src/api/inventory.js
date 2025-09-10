// CRUD (create, read, update, delete) operations for drinks
// Mainly for managing inventory and drink details
import api from "./api";

export const inventoryAPI = {
  // Fetch all drinks
  fetchAllDrinks: async () => {
    try {
      const response = await api.get("/api/drink/");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch drinks");
    }
  },

  // Fetch specific drink
  fetchDrink: async (drinkId) => {
    try {
      const response = await api.get(`/api/drink/${drinkId}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch drink");
    }
  },

  // Create new drink
  createDrink: async (drinkData) => {
    try {
      // Use FormData for file uploads
      const formData = new FormData();
      
      formData.append('name', drinkData.name);
      formData.append('description', drinkData.description || '');
      formData.append('price', drinkData.price.toString());
      formData.append('category', drinkData.category);
      formData.append('available', drinkData.available.toString());
      formData.append('stock', drinkData.stock.toString());
      formData.append('unavailable_threshold', drinkData.unavailable_threshold.toString());
      formData.append('low_stock_threshold', drinkData.low_stock_threshold.toString());

      // Only append image if it exists and is a File object
      if (drinkData.image && drinkData.image instanceof File) {
        formData.append('image', drinkData.image);
      }

      const response = await api.post("api/drink/", formData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to create drink");
    }
  },

  // Updated updateDrink method - remove manual Content-Type header
  updateDrink: async (drinkId, drinkData) => {
    try {
      // Use FormData for file uploads
      const formData = new FormData();
      
      formData.append('name', drinkData.name);
      formData.append('description', drinkData.description || '');
      formData.append('price', drinkData.price.toString());
      formData.append('category', drinkData.category);
      formData.append('available', drinkData.available.toString());
      formData.append('stock', drinkData.stock.toString());
      formData.append('unavailable_threshold', drinkData.unavailable_threshold.toString());
      formData.append('low_stock_threshold', drinkData.low_stock_threshold.toString());

      // Only append image if it exists and is a File object
      if (drinkData.image && drinkData.image instanceof File) {
        formData.append('image', drinkData.image);
      }

      // Don't set Content-Type header - let the browser set it automatically for FormData
      const response = await api.patch(`/api/drink/${drinkId}/`, formData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update drink");
    }
  },

  // Toggle drink availability
  toggleAvailability: async (drinkId, available) => {
    try {
      const response = await api.patch(`/api/drink/${drinkId}/`, {
        available: available
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update drink availability");
    }
  },

  // Delete drink
  deleteDrink: async (drinkId) => {
    try {
      const response = await api.delete(`/api/drink/${drinkId}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete drink");
    }
  },

  // Update low stock threshold for ALL drinks
  updateGlobalLowStockLevel: async (threshold) => {
    try {
      const response = await api.patch("/api/drink/low-stock-threshold/", {
        low_stock_threshold: threshold
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update global low-stock threshold");
    }
  },

  // Update unavailable threshold for ALL drinks
  updateGlobalUnavailableLevel: async (threshold) => {
    try {
      const response = await api.patch("/api/drink/threshold/", {
        unavailable_threshold: threshold
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update global unavailable threshold");
    }
  },

  // Update low stock threshold for specific drink
  updateDrinkLowStockLevel: async (drinkId, threshold) => {
    try {
      const response = await api.patch(`/api/drink/${drinkId}/threshold/`, {
        low_stock_threshold: threshold
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update drink threshold");
    }
  },

  // Update unavailable threshold for specific drink
  updateDrinkUnavailableLevel: async (drinkId, threshold) => {
    try {
      const response = await api.patch(`/api/drink/${drinkId}/threshold/`, {
        unavailable_threshold: threshold
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update drink threshold");
    }
  }
};