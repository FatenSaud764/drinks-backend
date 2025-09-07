import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, tokenManager } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: null,
    isAdmin: false,
    isStaff: false,
    loading: true
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const hasToken = tokenManager.hasAccessToken();
      if (!hasToken) {
        setAuth({ 
          isAuthenticated: false, 
          user: null, 
          isAdmin: false,
          isStaff: false,
          loading: false 
        });
        return;
      }
      
      const profile = await authAPI.getProfile();
      
      // All authenticated users must be staff
      if (profile.is_staff) {
        setAuth({ 
          isAuthenticated: true, 
          user: profile, 
          isAdmin: profile.is_superuser, // Only superusers can perform CRUD
          isStaff: true,
          loading: false 
        });
      } else {
        // Not staff - shouldn't have access to admin panel at all
        tokenManager.clearTokens();
        setAuth({ 
          isAuthenticated: false, 
          user: null, 
          isAdmin: false,
          isStaff: false,
          loading: false 
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      tokenManager.clearTokens();
      setAuth({ 
        isAuthenticated: false, 
        user: null, 
        isAdmin: false,
        isStaff: false,
        loading: false 
      });
    }
  };

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    tokenManager.setTokens(response.access, response.refresh);
    await checkAuthStatus();
    return response;
  };

  const logout = () => {
    tokenManager.clearTokens();
    setAuth({ 
      isAuthenticated: false, 
      user: null, 
      isAdmin: false,
      isStaff: false,
      loading: false 
    });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};