import api from "./api";

export const usersAPI = {
  // Fetch all users
  fetchAllUsers: async () => {
    try {
      const response = await api.get('/api/users/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all users');
    }
  },

  // Fetch customers only
  fetchCustomers: async () => {
    try {
      const response = await api.get('/api/users/?role=customer');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch customers');
    }
  },

  // Fetch staff only
  fetchStaff: async () => {
    try {
      const response = await api.get('/api/users/?role=staff');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch staff');
    }
  }
};
