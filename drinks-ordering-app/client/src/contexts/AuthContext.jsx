/** @author Kirsten Sanders */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AxiosInstance from '../components/Axios';
import { setAuthContext } from '../components/Axios';

// Create the context
const AuthContext = createContext();

// Auth utility functions
export const clearAuthTokens = () => {
  localStorage.removeItem('access token');
  localStorage.removeItem('refresh token');
  localStorage.setItem('loggedin', 'false');
};

export const setAuthTokens = (accessToken, refreshToken) => {
  localStorage.setItem('access token', accessToken);
  if (refreshToken) {
    localStorage.setItem('refresh token', refreshToken);
  }
  localStorage.setItem('loggedin', 'true');
};

export const getAuthTokens = () => {
  return {
    accessToken: localStorage.getItem('access token'),
    refreshToken: localStorage.getItem('refresh token'),
    isLoggedIn: localStorage.getItem('loggedin') === 'true'
  };
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => 
    localStorage.getItem('access token')
  );
  const [refreshToken, setRefreshToken] = useState(() => 
    localStorage.getItem('refresh token')
  );
  const [isLoggedIn, setIsLoggedIn] = useState(() => 
    localStorage.getItem('loggedin') === 'true'
  );
  const [isLoading, setIsLoading] = useState(false);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      setIsLoading(true);

      const response = await AxiosInstance.post('/api/auth/token/', credentials);
      
      const { access, refresh, user: userData } = response.data;
      
      // Store tokens
      setAuthTokens(access, refresh);
      setAccessToken(access);
      setRefreshToken(refresh);
      setUser(userData);
      setIsLoggedIn(true);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {

      if (refreshToken) {
        try {
          await AxiosInstance.post('/api/auth/logout/', { refresh: refreshToken });
        } catch (error) {

        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state and storage
      clearAuthTokens();
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setIsLoggedIn(false);
    }
  }, [refreshToken]);

  // Refresh token function
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken || refreshToken === 'null') {
      logout();
      return null;
    }

    try {
      const response = await AxiosInstance.post('/api/auth/token/refresh/', {
        refresh: refreshToken
      });
      
      const { access } = response.data;
      localStorage.setItem('access token', access);
      setAccessToken(access);
      
      return access;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return null;
    }
  }, [refreshToken, logout]);

  

  // Check authentication status on app load
  const checkAuth = useCallback(async () => {
    const tokens = getAuthTokens();
    
    if (!tokens.accessToken || tokens.accessToken === 'null') {
      setIsLoggedIn(false);
      return;
    }

    try {
      const response = await AxiosInstance.get('/api/auth/profile/');
      setUser(response.data);
      setIsLoggedIn(true);
    } catch (error) {
      // Token is invalid, try to refresh
      const newToken = await refreshAccessToken();
      if (!newToken) {
        setIsLoggedIn(false);
      }
    }
  }, [refreshAccessToken]);

  // Initialize auth state on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Update localStorage when tokens change
  useEffect(() => {
    if (accessToken && accessToken !== 'null') {
      localStorage.setItem('access token', accessToken);
    } else if (accessToken === null) {
      localStorage.removeItem('access token');
    }
  }, [accessToken]);

  useEffect(() => {
    if (refreshToken && refreshToken !== 'null') {
      localStorage.setItem('refresh token', refreshToken);
    } else if (refreshToken === null) {
      localStorage.removeItem('refresh token');
    }
  }, [refreshToken]);

  useEffect(() => {
    localStorage.setItem('loggedin', isLoggedIn.toString());
  }, [isLoggedIn]);

  useEffect(() => {
  setAuthContext({
    refreshAccessToken,
    logout,
  });
}, [refreshAccessToken, logout]);
  
  

  const value = {
    // State
    user,
    accessToken,
    refreshToken,
    isLoggedIn,
    isLoading,
    
    // Actions
    login,
    logout,
    refreshAccessToken,
    checkAuth,
    
    setAccessToken,
    setRefreshToken,
    setUser,
    setIsLoggedIn,
  };

  

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

