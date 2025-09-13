import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';
import { tokenManager } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const hasToken = tokenManager.hasAccessToken();
      if (!hasToken) {
        setAuth({ isAuthenticated: false, user: null, loading: false });
        return;
      }
      const profile = await authAPI.getProfile();
      // Only authenticate if user is admin
      if (profile.is_admin) {
        setAuth({ isAuthenticated: true, user: profile, loading: false });
      } else { // If something else (eg. staff) - keeping this for incase I want to make staff also login with global username
        setAuth({ isAuthenticated: false, user: null, loading: false });
      }
    } catch {
      tokenManager.clearTokens();
      setAuth({ isAuthenticated: false, user: null, loading: false });
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
    setAuth({ isAuthenticated: false, user: null, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);