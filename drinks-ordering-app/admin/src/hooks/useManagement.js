import { useState, useEffect, useCallback } from 'react';
import { managementAPI } from '../api/management';

export const useManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all staff and admin users
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

  // Update user role (PATCH) - Updated to handle level parameter
  const updateUserRole = useCallback(async (userId, roleData) => {
    setError(null);
    try {
      // Convert is_admin boolean to level string if needed for backwards compatibility
      const levelData = roleData.level ? 
        { level: roleData.level } : 
        { level: roleData.is_admin ? "admin" : "staff" };
      
      const updatedUser = await managementAPI.updateUserRole(userId, levelData);
      
      // Update the user in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, ...updatedUser } : user
        )
      );
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err; // Re-throw so the component can handle it
    }
  }, []);

  // Register staff user - Updated to handle simplified registration
  const registerUser = useCallback(async (userData) => {
    setError(null);
    try {
      // Only send the required fields that the backend accepts
      const registrationData = {
        username: userData.username,
        email: userData.email,
        password: userData.password
      };
      
      const newUser = await managementAPI.registerUser(registrationData);
      setUsers(prevUsers => [...prevUsers, newUser]);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err; // Re-throw so the component can handle it
    }
  }, []);

  // Helper function to promote user to admin
  const promoteToAdmin = useCallback(async (userId) => {
    return updateUserRole(userId, { level: "admin" });
  }, [updateUserRole]);

  // Helper function to demote user to staff
  const demoteToStaff = useCallback(async (userId) => {
    return updateUserRole(userId, { level: "staff" });
  }, [updateUserRole]);

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
    promoteToAdmin,
    demoteToStaff,
    clearError
  };
};