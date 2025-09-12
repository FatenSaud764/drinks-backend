import { useState, useEffect, useCallback } from 'react';
import { managementAPI } from '../api/management';

export const useManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await managementAPI.fetchAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user role (PATCH)
  const updateUserRole = useCallback(async (userId, roleData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await managementAPI.updateUserRole(userId, roleData);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? updatedUser : user
        )
      );
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Register user
  const registerUser = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const newUser = await managementAPI.registerUser(userData);
      setUsers(prevUsers => [...prevUsers, newUser]);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    updateUserRole,
    registerUser,
    clearError
  };
};