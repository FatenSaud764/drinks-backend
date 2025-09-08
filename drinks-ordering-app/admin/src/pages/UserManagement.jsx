// Real problematic rn lol - i need backend support
import { useState, useMemo } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useCustomers, useStaff } from '../hooks/useUsers';
import { authAPI } from '../api/auth';
import '../styles/Pages.css';
import '../styles/UserManagement.css';

const UserManagementPage = () => {
  const { isAuthenticated } = useAuth();
  const { showSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' or 'customers'
  
  // Use the custom hooks for fetching data
  const { users: staffUsers, loading: staffLoading, error: staffError, refetch: refetchStaff } = useStaff();
  const { users: customers, loading: customersLoading, error: customersError, refetch: refetchCustomers } = useCustomers();

  // Current data and loading state based on active tab
  const currentData = activeTab === 'staff' ? staffUsers : customers;
  const currentLoading = activeTab === 'staff' ? staffLoading : customersLoading;
  const currentError = activeTab === 'staff' ? staffError : customersError;
  const currentRefetch = activeTab === 'staff' ? refetchStaff : refetchCustomers;

  // Staff/Admin columns
  const staffColumns = useMemo(() => [
    {
      accessorKey: 'username',
      header: 'Username',
      size: 150,
      Cell: ({ row }) => (
        <div className="user-cell">
          <span className="username">{row.original.username}</span>
          <span className="user-email">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      size: 100,
      Cell: ({ row }) => (
        <select
          className={`role-select ${row.original.role}`}
          value={row.original.role}
          onChange={(e) => handleRoleChange(row.original.id, e.target.value)}
          disabled={!isAuthenticated || loading}
        >
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      Cell: ({ row }) => (
        <span className={`status-badge ${row.original.status}`}>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'ordersProcessed',
      header: 'Orders Processed',
      size: 120,
      Cell: ({ cell }) => (
        <span className="metric-value">{cell.getValue() || 0}</span>
      ),
    },
    {
      accessorKey: 'lastLogin',
      header: 'Last Login',
      size: 150,
      Cell: ({ cell }) => {
        const dateValue = cell.getValue();
        if (!dateValue) return <span>Never</span>;
        const date = new Date(dateValue);
        return (
          <div className="date-cell">
            <span className="date-main">{date.toLocaleDateString()}</span>
            <span className="date-time">{date.toLocaleTimeString()}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Member Since',
      size: 120,
      Cell: ({ cell }) => {
        const date = new Date(cell.getValue());
        return <span className="date-main">{date.toLocaleDateString()}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 180,
      enableSorting: false,
      Cell: ({ row }) => (
        <div className="actions-cell">
          <button
            className={`action-btn toggle-btn ${row.original.status === 'active' ? 'deactivate' : 'activate'}`}
            onClick={() => handleToggleStatus(row.original.id, row.original.status, 'staff')}
            disabled={!isAuthenticated || loading}
          >
            {row.original.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            className="action-btn reset-btn"
            onClick={() => handleResetPassword(row.original.id)}
            disabled={!isAuthenticated || loading}
          >
            Reset Password
          </button>
        </div>
      ),
    },
  ], [isAuthenticated, loading]);

  // Customer columns
  const customerColumns = useMemo(() => [
    {
      accessorKey: 'username',
      header: 'Username',
      size: 150,
      Cell: ({ row }) => (
        <div className="user-cell">
          <span className="username">{row.original.username}</span>
          <span className="user-email">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      Cell: ({ row }) => (
        <span className={`status-badge ${row.original.status}`}>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'totalOrders',
      header: 'Total Orders',
      size: 100,
      Cell: ({ cell }) => (
        <span className="metric-value">{cell.getValue() || 0}</span>
      ),
    },
    {
      accessorKey: 'totalSpent',
      header: 'Total Spent',
      size: 120,
      Cell: ({ cell }) => (
        <span className="price-cell">R{(cell.getValue() || 0).toFixed(2)}</span>
      ),
    },
    {
      accessorKey: 'lastLogin',
      header: 'Last Login',
      size: 150,
      Cell: ({ cell }) => {
        const dateValue = cell.getValue();
        if (!dateValue) return <span>Never</span>;
        const date = new Date(dateValue);
        return (
          <div className="date-cell">
            <span className="date-main">{date.toLocaleDateString()}</span>
            <span className="date-time">{date.toLocaleTimeString()}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Member Since',
      size: 120,
      Cell: ({ cell }) => {
        const date = new Date(cell.getValue());
        return <span className="date-main">{date.toLocaleDateString()}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 150,
      enableSorting: false,
      Cell: ({ row }) => (
        <div className="actions-cell">
          <button
            className={`action-btn toggle-btn ${row.original.status === 'active' ? 'suspend' : 'activate'}`}
            onClick={() => handleToggleStatus(row.original.id, row.original.status, 'customers')}
            disabled={!isAuthenticated || loading}
          >
            {row.original.status === 'active' ? 'Suspend' : 'Activate'}
          </button>
          <button
            className="action-btn view-btn"
            onClick={() => handleViewOrders(row.original.id)}
          >
            View Orders
          </button>
        </div>
      ),
    },
  ], [isAuthenticated, loading]);

  const handleRoleChange = async (userId, newRole) => {
    if (!isAuthenticated) {
      showSnackbar('Authentication required', 'error');
      return;
    }

    try {
      setLoading(true);
      await authAPI.updateUserRole(userId, newRole);
      await refetchStaff(); // Refetch staff data
      showSnackbar(`User role updated to ${newRole}`, 'success');
    } catch (err) {
      showSnackbar(err.message || 'Failed to update role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus, userType) => {
    if (!isAuthenticated) {
      showSnackbar('Authentication required', 'error');
      return;
    }

    try {
      setLoading(true);
      const newStatus = currentStatus === 'active' ? 
        (userType === 'customers' ? 'suspended' : 'inactive') : 
        'active';
      
      await authAPI.updateUserStatus(userId, newStatus);
      await currentRefetch(); // Refetch current data
      
      const statusAction = newStatus === 'active' ? 'activated' : 
        (newStatus === 'suspended' ? 'suspended' : 'deactivated');
      showSnackbar(`User ${statusAction}`, 'success');
    } catch (err) {
      showSnackbar(err.message || 'Failed to update status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!isAuthenticated) {
      showSnackbar('Authentication required', 'error');
      return;
    }

    const user = staffUsers.find(u => u.id === userId);
    if (window.confirm(`Reset password for ${user?.username}?`)) {
      try {
        setLoading(true);
        await authAPI.resetPassword(userId);
        showSnackbar(`Password reset email sent to ${user?.email}`, 'success');
      } catch (err) {
        showSnackbar(err.message || 'Failed to reset password', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewOrders = (userId) => {
    const user = customers.find(u => u.id === userId);
    showSnackbar(`Viewing orders for ${user?.username}`, 'info');
    // Navigate to orders page with customer filter
    // Example: navigate(`/orders?customerId=${userId}`);
  };

  // Calculate stats from real data
  const stats = useMemo(() => {
    if (activeTab === 'staff') {
      return {
        total: staffUsers.length,
        active: staffUsers.filter(u => u.status === 'active').length,
        admins: staffUsers.filter(u => u.role === 'admin').length,
        staff: staffUsers.filter(u => u.role === 'staff').length,
      };
    } else {
      return {
        total: customers.length,
        active: customers.filter(u => u.status === 'active').length,
        suspended: customers.filter(u => u.status === 'suspended').length,
        totalRevenue: customers.reduce((sum, u) => sum + (u.totalSpent || 0), 0),
      };
    }
  }, [staffUsers, customers, activeTab]);

  const currentColumns = activeTab === 'staff' ? staffColumns : customerColumns;

  return (
    <div className="page">
      <div className="page-container">
        <div className="page-header">
          <h1>User Management</h1>
          <p>Manage staff permissions and customer accounts</p>
          {!isAuthenticated && (
            <div className="auth-notice">
              <strong>Note:</strong> Authentication required for user management actions.
            </div>
          )}
        </div>

        {/* Error Display */}
        {currentError && (
          <div className="error-banner">
            <div className="error-content">
              <p>Error: {currentError}</p>
              <div className="error-actions">
                <button onClick={() => currentRefetch()} className="btn-retry">
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Type Tabs */}
        <div className="user-tabs">
          <button
            className={`user-tab ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            Staff & Admins
            <span className="tab-count">{staffUsers.length}</span>
          </button>
          <button
            className={`user-tab ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            Customers
            <span className="tab-count">{customers.length}</span>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="user-stats">
          <div className="stat-card">
            <div className="stat-value total">{stats.total}</div>
            <div className="stat-label">Total {activeTab === 'staff' ? 'Staff' : 'Customers'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value active">{stats.active}</div>
            <div className="stat-label">Active</div>
          </div>
          {activeTab === 'staff' ? (
            <>
              <div className="stat-card">
                <div className="stat-value admin">{stats.admins}</div>
                <div className="stat-label">Admins</div>
              </div>
              <div className="stat-card">
                <div className="stat-value staff">{stats.staff}</div>
                <div className="stat-label">Staff</div>
              </div>
            </>
          ) : (
            <>
              <div className="stat-card">
                <div className="stat-value suspended">{stats.suspended}</div>
                <div className="stat-label">Suspended</div>
              </div>
              <div className="stat-card">
                <div className="stat-value revenue">R{stats.totalRevenue?.toFixed(2)}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
            </>
          )}
        </div>

        {/* Loading indicator */}
        {(loading || currentLoading) && (
          <div className="loading-indicator">
            <p>Updating user data...</p>
          </div>
        )}

        {/* Users Table */}
        <div className="table-container">
          <MaterialReactTable
            columns={currentColumns}
            data={currentData}
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
              placeholder: `Search ${activeTab}...`,
              variant: 'outlined',
              size: 'small',
            }}
            renderEmptyRowsFallback={() => (
              <div className="custom-empty-state">
                No {activeTab} to display
              </div>
            )}
            state={{
              isLoading: currentLoading,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;