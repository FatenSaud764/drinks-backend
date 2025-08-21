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
  }
};