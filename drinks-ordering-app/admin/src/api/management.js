/**
 * @author Kirsten Sanders
 * @description This is the API service for user management (admin only can access these endpoints)
*/

import api from "./api";

export const managementAPI = {
  // Fetch all staff and admin users
  fetchAllUsers: async () => {
    try {
      const response = await api.get("/api/management/");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch users");
    }
  },

  // Update user level (stadd/admin)
  updateUserRole: async (userId, roleData) => {
    try {
      const response = await api.patch(`/api/management/${userId}/role/`, {
        level: roleData.level  // Send "staff" or "admin"
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update user role");
    }
  },

  // Register new staff user
  registerUser: async (userData) => {
    try {
      const response = await api.post("/api/management/register/", {
        username: userData.username,
        email: userData.email,
        password: userData.password
        // Note: role is automatically set to 'staff' by backend
        // Note: is_admin is automatically set to false by backend
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to register user");
    }
  }
};