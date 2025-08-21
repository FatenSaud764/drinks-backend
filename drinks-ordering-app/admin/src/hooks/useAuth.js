// (for authentication state - not used yet though lol - just for incase)
import { useState, useEffect, useCallback } from 'react';
import api from '../api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Assuming you have a /me endpoint or similar
        const token = localStorage.getItem('token'); // This is for auth, not data storage
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/api/auth/me/');
          setUser(response.data);
        }
      } catch (err) {
        // Token might be invalid
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/api/auth/login/', credentials);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      return userData;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(user);
  const isStaff = user?.role === 'staff';
  const isCustomer = user?.role === 'customer';

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isStaff,
    isCustomer,
    login,
    logout
  };
};