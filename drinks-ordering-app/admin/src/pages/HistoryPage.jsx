/**
 * @author Kirsten Sanders
 * @description This is the HistoryPage component for the admin interface.
 * It displays completed and cancelled orders with filtering options.
*/

import { useState, useEffect } from 'react';
import '../styles/Pages.css';
import OrderCard from '../components/OrderCard';
import FilterControls from '../components/FilterControls';
import {
  filterOrdersByStatus,
  filterOrdersBySearch,
  filterOrdersByDate,
  getHistoryOrderStatusCounts
} from '../utils/OrderUtils';
import { ORDER_STATUSES } from 'shared/types';
import { useOrderHistory } from '../hooks/useOrders';
// Notifications
import { useSnackbar } from '../contexts/SnackbarContext'; // Snackbar notifications
import { toast } from 'react-toastify'; // Keep for client-side notifications

const HistoryPage = () => {
  const {
    orders: historyOrders,
    loading,
    error,
    refetch,
    restoreOrder,
    clearError
  } = useOrderHistory();

  const { showSnackbar } = useSnackbar();

  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  // Filter orders based on status, search term, and date
  useEffect(() => {
    let filtered = historyOrders.filter(order => 
      [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED].includes(order.status)
    );

    filtered = filterOrdersByStatus(filtered, statusFilter);
    filtered = filterOrdersBySearch(filtered, searchTerm);
    filtered = filterOrdersByDate(filtered, dateFilter);

    setFilteredOrders(filtered);
  }, [historyOrders, statusFilter, searchTerm, dateFilter]);

  const handleRestoreOrder = async (orderId) => {
    try {
      const order = historyOrders.find(o => o.id === parseInt(orderId));
      
      // Only allow restoring cancelled orders
      if (!order || order.status !== ORDER_STATUSES.CANCELLED) {
        showSnackbar('Only cancelled orders can be restored', 'error');
        return;
      }

      if (window.confirm(`Are you sure you want to restore order ${order.orderNumber || `#${order.id}`} back to active orders?`)) {
        await restoreOrder(parseInt(orderId));
        showSnackbar(`Order ${order.orderNumber || `#${order.id}`} restored to active orders`, 'success');
      }
    } catch (err) {
      showSnackbar(`Failed to restore order: ${err.message}`, 'error');
    }
  };

  const statusCounts = getHistoryOrderStatusCounts(historyOrders.filter(order => 
    [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED].includes(order.status)
  ));
  const statusOptions = ['all', 'completed', 'cancelled'];

  // Artificial loading state to showcase loading spinner on initial load
  const [artificialLoading, setArtificialLoading] = useState(true);
  // Delay for showcasing the loading indicator
  useEffect(() => {
    const timer = setTimeout(() => {
      setArtificialLoading(false);
    }, 500); // timeout just to showcase the loading state

    return () => clearTimeout(timer);
  }, []);

  if (loading || artificialLoading) {
    return (
      <div className="page">
        <div className="page-container">
          <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Loading Order History...</p>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-container">
        <div className="page-header">
          <h1>Order History</h1>
          <p>View completed and cancelled orders</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <div className="error-content">
              <p>Error: {error}</p>
              <div className="error-actions">
                <button 
                  onClick={() => {
                    clearError();
                    refetch();
                  }} 
                  className="btn-refresh-error"
                  disabled={loading}
                >
                  Retry
                </button>
                <button onClick={clearError} className="btn-clear-error">×</button>
              </div>
            </div>
          </div>
        )}

        <FilterControls
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          statusCounts={statusCounts}
          statusOptions={statusOptions}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          showDateFilter={true}
        />

        {/* Loading indicator for updates */}
        {loading && historyOrders.length > 0 && (
          <div className="loading-indicator">
            <p>Updating order history...</p>
          </div>
        )}

        <div className="orders-grid">
          {filteredOrders.length === 0 ? (
            <div className="no-orders">
              <h3>No historical orders found</h3>
              <p>No orders match your current search criteria.</p>
              <button onClick={refetch} className="refresh-button" disabled={loading}>
                Refresh History
              </button>
            </div>
          ) : (
            filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={{
                  ...order,
                  id: parseInt(order.id),
                  totalAmount: parseFloat(order.total_price || order.totalAmount || 0),
                  orderTime: new Date(order.created_at || order.orderTime),
                  lastUpdated: new Date(order.updated_at || order.lastUpdated),
                  completedAt: order.completedAt ? new Date(order.completedAt) : null,
                  cancelledAt: order.cancelledAt ? new Date(order.cancelledAt) : null,
                  orderNumber: order.orderNumber || `#${order.id}`,
                  // Show restore button only for cancelled orders
                  canRestore: order.status === ORDER_STATUSES.CANCELLED
                }}
                onUpdateStatus={handleRestoreOrder}
                isHistory={true}
                loading={loading}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;