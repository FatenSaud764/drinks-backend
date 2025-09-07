import api from "./api";

export const authAPI = {
  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get("/api/auth/profile/");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.patch("/api/auth/profile/", profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Register new admin member (admins can add more admins)
  register: async (userData) => {
    try {
      const response = await api.post("/api/auth/register/", userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Login - get access token
  login: async (credentials) => {
    try {
      const response = await api.post("/api/auth/token/", credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post("/api/auth/token/refresh/", {
        refresh: refreshToken
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check if user is authenticated and get their role
  checkAuth: async () => {
    try {
      const profile = await authAPI.getProfile();
      return {
        isAuthenticated: true,
        user: profile,
        isAdmin: profile.is_staff,
        isStaff: profile.role === 'staff',
        isCustomer: profile.role === 'customer'
      };
    } catch (error) {
      return {
        isAuthenticated: false,
        user: null,
        isAdmin: false,
        isStaff: false,
        isCustomer: false
      };
    }
  },
};

// Helper functions for token management
export const tokenManager = {
  // Store tokens
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },

  // Get stored access token
  getAccessToken: () => {
    return localStorage.getItem('accessToken');
  },

  // Get stored refresh token
  getRefreshToken: () => {
    return localStorage.getItem('refreshToken');
  },

  // Clear all tokens
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  // Check if access token exists (basic check)
  hasAccessToken: () => {
    return !!localStorage.getItem('accessToken');
  }
};

// Enhanced API interceptor for automatic token handling
export const setupAuthInterceptors = () => {
  // Request interceptor to add auth header
  api.interceptors.request.use(
    (config) => {
      const token = tokenManager.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for token refresh
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If token expired and we haven't already tried to refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = tokenManager.getRefreshToken();
          if (refreshToken) {
            const response = await authAPI.refreshToken(refreshToken);
            tokenManager.setTokens(response.access, response.refresh || refreshToken);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${response.access}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login if needed
          tokenManager.clearTokens();
          // You might want to emit an event here for your app to handle
          window.dispatchEvent(new CustomEvent('auth:tokenExpired'));
        }
      }

      return Promise.reject(error);
    }
  );
};