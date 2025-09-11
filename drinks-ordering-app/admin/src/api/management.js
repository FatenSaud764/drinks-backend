// Managing users, roles, and permissions - admin users only
import api from "./api";

export const managementAPI = {
  // Fetch all users
  fetchAllUsers: async () => {
    try {
      const response = await api.get("/api/management/");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch users");
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await api.post("/api/management/", {
        username: userData.username,
        email: userData.email,
        role: userData.role,
        password: userData.password
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to create user");
    }
  },

  // Update user role (PATCH)
  updateUserRole: async (userId, roleData) => {
    try {
      const response = await api.patch(`/api/management/${userId}/role/`, {
        username: roleData.username,
        email: roleData.email,
        role: roleData.role,
        password: roleData.password
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update user role");
    }
  },

  // Register new user
  registerUser: async (userData) => {
    try {
      const response = await api.post("/api/management/register/", {
        username: userData.username,
        email: userData.email,
        role: userData.role,
        password: userData.password
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to register user");
    }
  }
};