import { useState, useEffect, useCallback } from 'react';
import { usersAPI } from '../api/users';

export const useUsers = (role = null) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (role === 'customer') {
        data = await usersAPI.fetchCustomers();
      } else if (role === 'staff') {
        data = await usersAPI.fetchStaff();
      } else {
        data = await usersAPI.fetchAllUsers();
      }
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers
  };
};

export const useCustomers = () => useUsers('customer');
export const useStaff = () => useUsers('staff');