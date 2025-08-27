import React, { useState, useEffect } from 'react';
import '../styles/Pages.css';
import OrderCard from '../components/OrderCard';
import FilterControls from '../components/FilterControls';
import OTPModal from '../components/OTPModal';
import { Lock as LockIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  ORDER_STATUSES,
  filterOrdersByStatus,
  filterOrdersBySearch,
  getActiveOrderStatusCounts,
  notifyClient,
} from '../utils/OrderUtils';
import { useActiveOrders } from '../hooks/useOrders';
import { validateCompletionPIN, validateOrderPIN } from '../services/OrderService';

const OrdersPage = () => {
  const {
    orders,
    loading,
    error,
    refetch,
    updateOrderStatus,
    clearError
  } = useActiveOrders();

  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // PIN Authentication Modal state
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingCompletionOrder, setPendingCompletionOrder] = useState(null);
  const [pinModalMode, setPinModalMode] = useState('complete'); // 'complete' or 'find'

  // Filter orders based on status and search term - exclude completed and cancelled
  useEffect(() => {
    let filtered = orders.filter(order => 
      ![ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED].includes(order.status)
    );

    filtered = filterOrdersByStatus(filtered, statusFilter);
    filtered = filterOrdersBySearch(filtered, searchTerm);

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      // If trying to complete an order (READY -> COMPLETED), show PIN modal
      if (newStatus === ORDER_STATUSES.COMPLETED) {
        const order = orders.find(o => o.id === parseInt(orderId));
        if (order && order.status === ORDER_STATUSES.READY) {
          setPendingCompletionOrder(order);
          setPinModalMode('complete');
          setPinModalOpen(true);
          return; // Don't update status yet, wait for PIN confirmation
        }
      }
      
      // For all other status updates, proceed normally
      await updateOrderStatus(parseInt(orderId), newStatus);
      toast.success(`Order updated to ${newStatus.toUpperCase()}`);
      notifyClient(orderId, newStatus);
    } catch (err) {
      toast.error(`Failed to update order: ${err.message}`);
    }
  };

  // Handle PIN authentication result
  const handlePinConfirmation = async (isConfirmed, order = null) => {
    if (isConfirmed) {
      try {
        if (pinModalMode === 'complete' && pendingCompletionOrder) {
          // Complete the specific order that was pending
          await updateOrderStatus(pendingCompletionOrder.id, ORDER_STATUSES.COMPLETED);
          toast.success(`Order ${pendingCompletionOrder.orderNumber || `#${pendingCompletionOrder.id}`} completed successfully!`);
        } else if (pinModalMode === 'find' && order) {
          // Complete the order found by PIN
          await updateOrderStatus(order.id, ORDER_STATUSES.COMPLETED);
          toast.success(`Order ${order.orderNumber || `#${order.id}`} completed successfully!`);
        }
      } catch (err) {
        toast.error(`Failed to complete order: ${err.message}`);
      }
    }
    
    // Reset modal state
    setPinModalOpen(false);
    setPendingCompletionOrder(null);
    setPinModalMode('complete');
  };

  // Handle "Complete Order by PIN" button
  const handleCompleteByPin = () => {
    setPendingCompletionOrder(null);
    setPinModalMode('find');
    setPinModalOpen(true);
  };

  // Get ready orders for the PIN modal autocomplete
  const getReadyOrders = () => {
    return orders.filter(order => order.status === ORDER_STATUSES.READY);
  };

  const statusCounts = getActiveOrderStatusCounts(orders);
  const statusOptions = ['all', 'pending', 'preparing', 'ready'];
  const readyOrdersCount = statusCounts.ready;

  // Show loading state
  if (loading && orders.length === 0) {
    return (
      <div className="page">
        <div className="page-container">
          <div className="loading-state">
            <h3>Loading orders...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-container">
        <div className="page-header">
          <h1>Active Orders</h1>
          <p>Manage active orders and update status in real-time</p>
          
          {/* Complete by PIN Button */}
          {readyOrdersCount > 0 && (
            <div className="page-actions">
              <button 
                className="btn-complete-by-pin"
                onClick={handleCompleteByPin}
                disabled={loading}
              >
                <LockIcon /> Complete Order by PIN ({readyOrdersCount} ready)
              </button>
            </div>
          )}
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
        />

        {/* Loading indicator for updates */}
        {loading && orders.length > 0 && (
          <div className="loading-indicator">
            <p>Updating orders...</p>
          </div>
        )}

        <div className="orders-grid">
          {filteredOrders.length === 0 ? (
            <div className="no-orders">
              <h3>No active orders found</h3>
              <p>No active orders match your current search criteria.</p>
              <button onClick={refetch} className="refresh-button">
                Refresh Orders
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
                  orderNumber: order.orderNumber || `#${order.id}`
                }}
                onUpdateStatus={handleUpdateOrderStatus}
                isHistory={false}
                loading={loading}
              />
            ))
          )}
        </div>

        {/* PIN Authentication Modal */}
        <OTPModal
          open={pinModalOpen}
          onClose={() => {
            setPinModalOpen(false);
            setPendingCompletionOrder(null);
            setPinModalMode('complete');
          }}
          onConfirm={handlePinConfirmation}
          order={pendingCompletionOrder}
          mode={pinModalMode}
          availableOrders={getReadyOrders()}
          title={pinModalMode === 'find' ? 'Complete Order - Find by PIN' : 'PIN Required for Order Completion'}
          message={pinModalMode === 'find' 
            ? 'Enter PIN or search for order to complete:' 
            : `Please enter PIN to complete order ${pendingCompletionOrder?.orderNumber || `#${pendingCompletionOrder?.id}`}:`
          }
          validatePIN={pinModalMode === 'find' ? validateCompletionPIN : (pin) => validateOrderPIN(pin, pendingCompletionOrder?.orderNumber || `${pendingCompletionOrder?.id}`)}
        />
      </div>
    </div>
  );
};

export default OrdersPage;