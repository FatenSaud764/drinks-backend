/**
 * @author Kirsten Sanders
 * @description This is the UserManagementPage component for the admin interface.
 * It allows viewing, adding, and managing staff and admin user accounts.
*/

import { useState, useMemo } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { useAuth } from '../contexts/AuthContext';
import { useManagement } from '../hooks/useManagement';
import '../styles/Pages.css';
import '../styles/ManagementPage.css';
import '../styles/Modal.css';
// Notifications
import { useSnackbar } from '../contexts/SnackbarContext';

const UserManagementPage = () => {
  const { isAuthenticated } = useAuth();
  const { showSnackbar } = useSnackbar();
  const { users, loading, error, registerUser, deleteUser, updateUserRole, clearError } = useManagement();

  const [modalOpen, setModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'admin', 'staff'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validateForm = (data) => {
    const errors = {};

    if (!data.username?.trim()) {
      errors.username = 'Username is required';
    }

    if (!data.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Valid email is required';
    }

    // Password validation for new users
    if (!data.password) {
      errors.password = 'Password is required';
    } else if (data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Check for duplicate username/email
    const existingUser = users.find(user => 
      user.username === data.username || user.email === data.email
    );
    
    if (existingUser) {
      if (existingUser.username === data.username) {
        errors.username = 'Username already exists';
      }
      if (existingUser.email === data.email) {
        errors.email = 'Email already exists';
      }
    }

    return errors;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRoleChange = async (userId, newLevel) => {
    try {
      await updateUserRole(userId, { level: newLevel });
      showSnackbar(`User role updated to ${newLevel} successfully!`, 'success');
    } catch (err) {
      showSnackbar(`Failed to update user role: ${err.message}`, 'error');
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'username',
        header: 'Username',
        size: 120,
        Cell: ({ cell }) => (
          <span className="username-cell">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 200,
        Cell: ({ cell }) => (
          <span className="user-email">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'is_admin',
        header: 'Level',
        size: 150,
        Cell: ({ row }) => (
          <select
            className={`role-badge ${row.original.is_admin ? 'admin' : 'staff'}`}
            value={row.original.is_admin ? 'admin' : 'staff'}
            onChange={(e) => handleRoleChange(row.original.id, e.target.value)}
            disabled={!isAuthenticated}
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        size: 130,
        Cell: ({ cell }) => (
          <span className="date-cell">{formatDate(cell.getValue())}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 150,
        enableSorting: false,
        Cell: ({ row }) => (
          <div className="actions-cell">
            {isAuthenticated && (
              <button
                className="action-btn delete-btn"
                onClick={() => handleDeleteUser(row.original.id)}
              >
                Delete
              </button>
            )}
          </div>
        ),
      },
    ],
    [isAuthenticated, users]
  );

  const clearForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setValidationErrors({});
  };

  const openAddModal = () => {
    if (!isAuthenticated) {
      showSnackbar('Authentication required to add users', 'error');
      return;
    }
    clearForm();
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    clearForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      showSnackbar('Authentication required', 'error');
      closeModal();
      return;
    }
    
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const userData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      await registerUser(userData);
      showSnackbar(`Staff user "${userData.username}" added successfully!`, 'success');
      closeModal();
    } catch (err) {
      showSnackbar(`Failed to add user: ${err.message}`, 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!isAuthenticated) {
      showSnackbar('Authentication required to delete staff users', 'error');
      return;
    }
    
    const user = users.find(u => u.id === userId);
    const userName = user ? user.username : `user ID ${userId}`;
    
    if (window.confirm(`Are you sure you want to delete "${userName}"?`)) {
      try {
        await deleteUser(userId);
        showSnackbar(`"${userName}" deleted successfully!`, 'success');
      } catch (err) {
        showSnackbar(`Failed to delete user: ${err.message}`, 'error');
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter(u => u.is_admin).length,
      staff: users.filter(u => !u.is_admin).length
    };
  }, [users]);

  // Filter users based on active filter
  const filteredUsers = useMemo(() => {
    if (activeFilter === 'admin') {
      return users.filter(u => u.is_admin);
    } else if (activeFilter === 'staff') {
      return users.filter(u => !u.is_admin);
    }
    return users;
  }, [users, activeFilter]);

  return (
    <div className="page">
      <div className="page-container">
        <div className="page-header">
          <h1>User Management</h1>
          <p>Manage staff and admin accounts</p>
          {!isAuthenticated && (
            <div className="auth-notice">
              <strong>Note:</strong> Authentication required for adding users and updating roles.
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <div className="error-content">
              <p>Error: {error}</p>
              <div className="error-actions">
                <button onClick={clearError} className="btn-clear-error">×</button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="inventory-stats">
          <div 
            className={`stat-card ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-value total">{stats.total}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div 
            className={`stat-card ${activeFilter === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveFilter('admin')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-value admin">{stats.admins}</div>
            <div className="stat-label">Admins</div>
          </div>
          <div 
            className={`stat-card ${activeFilter === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveFilter('staff')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-value staff">{stats.staff}</div>
            <div className="stat-label">Staff</div>
          </div>
        </div>

        {/* Control Buttons */}
        {isAuthenticated && (
          <div className="orders-controls drink-controls">
            <button className="notify-button" onClick={openAddModal}>
              Add New Staff User
            </button>
          </div>
        )}

        {/* Material React Table */}
        <div className="orders-controls table-container">
          <MaterialReactTable
            columns={columns}
            data={filteredUsers}
            enableGlobalFilter={true}
            enableColumnFilters={false}
            enableSorting={true}
            enablePagination={true}
            enableDensityToggle={false}
            enableFullScreenToggle={false}
            enableHiding={true}
            enableColumnActions={false}
            enableTopToolbar={true}
            enableBottomToolbar={true}
            initialState={{
              pagination: { pageSize: 10, pageIndex: 0 },
              showGlobalFilter: true,
            }}
            muiSearchTextFieldProps={{
              placeholder: 'Search users...',
              variant: 'outlined',
              size: 'small',
            }}
            muiTablePaginationProps={{
              sx: {
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  color: 'var(--text-muted) !important',
                },
              },
            }}
            renderEmptyRowsFallback={() => (
              <div className="custom-empty-state">
                No users to display
              </div>
            )}
            state={{
              isLoading: loading && users.length === 0,
            }}
          />
        </div>

        {/* Add User Modal */}
        {modalOpen && isAuthenticated && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Add New Staff User</h3>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="form-field">
                      <label htmlFor="user-username" className="form-label">Username</label>
                      <input
                        id="user-username"
                        type="text"
                        placeholder="Enter username"
                        className={`search-input ${validationErrors.username ? 'error' : ''}`}
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        required
                      />
                      {validationErrors.username && (
                        <div className="error-message">{validationErrors.username}</div>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="user-email" className="form-label">Email</label>
                      <input
                        id="user-email"
                        type="email"
                        placeholder="Enter email address"
                        className={`search-input ${validationErrors.email ? 'error' : ''}`}
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                      {validationErrors.email && (
                        <div className="error-message">{validationErrors.email}</div>
                      )}
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-field">
                      <label htmlFor="user-password" className="form-label">Password</label>
                      <input
                        id="user-password"
                        type="password"
                        placeholder="Enter password"
                        className={`search-input ${validationErrors.password ? 'error' : ''}`}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                      />
                      {validationErrors.password && (
                        <div className="error-message">{validationErrors.password}</div>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="user-confirm-password" className="form-label">Confirm Password</label>
                      <input
                        id="user-confirm-password"
                        type="password"
                        placeholder="Confirm password"
                        className={`search-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        required
                      />
                      {validationErrors.confirmPassword && (
                        <div className="error-message">{validationErrors.confirmPassword}</div>
                      )}
                    </div>
                  </div>

                  <div className="form-note">
                    <p><strong>Note:</strong> New users are automatically created as Staff. You can promote them to Admin using the role dropdown after creation.</p>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button type="button" className="nav-button" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="notify-button" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Staff User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;