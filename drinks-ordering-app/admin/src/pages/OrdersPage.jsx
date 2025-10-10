/**
 * @author Kirsten Sanders
 * @description This is the main page for managing active orders in the admin interface.
 * It allows staff to view, filter, search, and update the status of orders in real-time.
*/

import { useState, useEffect, useRef } from 'react';
import '../styles/Pages.css';
import OrderCard from '../components/OrderCard';
import SkeletonCard from '../components/SkeletonCard';
import FilterControls from '../components/FilterControls';
import OTPModal from '../components/OTPModal';
import { Lock as LockIcon } from '@mui/icons-material';
import {
  filterOrdersByStatus,
  filterOrdersBySearch,
  getActiveOrderStatusCounts,
  notifyClient,
} from '../utils/OrderUtils';
import { ORDER_STATUSES } from 'shared/types';
import { normaliseOrder } from '../utils/normaliseOrder';
import { useActiveOrders } from '../hooks/useOrders';
import { useInventory } from '../hooks/useInventory';
import "../styles/Loading.css";
import { useSnackbar } from '../contexts/SnackbarContext';

const OrdersPage = () => {
  const {
    orders,
    loading,
    error,
    refetch,
    updateOrderStatus,
    clearError
  } = useActiveOrders();

  const { drinks, loading: drinksLoading } = useInventory();

  const { showSnackbar } = useSnackbar();

  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingCompletionOrder, setPendingCompletionOrder] = useState(null);
  const [pinModalMode, setPinModalMode] = useState('complete');

  // Custom sorting function - latest to oldest
  const sortOrders = (ordersToSort) => {
    return [...ordersToSort].sort((a, b) => {
      const aDate = new Date(a.createdAt || a.created_at || a.orderTime || 0);
      const bDate = new Date(b.createdAt || b.created_at || b.orderTime || 0);
      
      return bDate - aDate; // Latest first
    });
  };

  // Scroll to and highlight order
  const scrollToOrder = (orderId) => {
    const element = document.getElementById(`order-${orderId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-pulse');
      setTimeout(() => element.classList.remove('highlight-pulse'), 2000);
    }
  };

  // Filter orders
  useEffect(() => {
    let filtered = orders.filter(order => 
      ![ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED].includes(order.status)
    );

    filtered = filterOrdersByStatus(filtered, statusFilter);
    filtered = filterOrdersBySearch(filtered, searchTerm);
    filtered = sortOrders(filtered);

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      if (newStatus === ORDER_STATUSES.COMPLETED) {
        const order = orders.find(o => o.id === parseInt(orderId));
        if (order && order.status === ORDER_STATUSES.READY) {
          setPendingCompletionOrder(order);
          setPinModalMode('complete');
          setPinModalOpen(true);
          return;
        }
      }
      
      showSnackbar(`Updating Order #${orderId} to ${newStatus.toUpperCase()}`, 'success');
      await updateOrderStatus(parseInt(orderId), newStatus);
      notifyClient(orderId, newStatus);
    } catch (err) {
      showSnackbar(`Failed to update order: ${err.message}`, 'error');
    }
  };

  const handlePinConfirmation = async (isConfirmed, order = null) => {
    if (isConfirmed) {
      try {
        if (pinModalMode === 'complete' && pendingCompletionOrder) {
          await updateOrderStatus(pendingCompletionOrder.id, ORDER_STATUSES.COMPLETED);
          showSnackbar(
            `Order ${pendingCompletionOrder.orderNumber || `#${pendingCompletionOrder.id}`} completed successfully!`, 
            'success'
          );
        } else if (pinModalMode === 'find' && order) {
          await updateOrderStatus(order.id, ORDER_STATUSES.COMPLETED);
          showSnackbar(
            `Order ${order.orderNumber || `#${order.id}`} completed successfully!`, 
            'success'
          );
        }
      } catch (err) {
        showSnackbar(`Failed to complete order: ${err.message}`, 'error');
      }
    }
    
    setPinModalOpen(false);
    setPendingCompletionOrder(null);
    setPinModalMode('complete');
  };

  const handleCompleteByPin = () => {
    setPendingCompletionOrder(null);
    setPinModalMode('find');
    setPinModalOpen(true);
  };

  const getReadyOrders = () => {
    return orders.filter(order => order.status === ORDER_STATUSES.READY);
  };

  const statusCounts = getActiveOrderStatusCounts(orders);
  const statusOptions = ['all', 'pending', 'preparing', 'ready'];
  const readyOrdersCount = statusCounts.ready;

  if (loading || drinksLoading) {
    return (
      <div className="page">
        <div className="page-container">
          <div className="page-header">
            <h1>Active Orders</h1>
            <p>Loading {loading && drinksLoading ? 'orders and menu items' : loading ? 'orders' : 'menu items'}...</p>
          </div>

          <FilterControls
            searchTerm=""
            setSearchTerm={() => {}}
            statusFilter="all"
            setStatusFilter={() => {}}
            statusCounts={{ all: 0, pending: 0, preparing: 0, ready: 0 }}
            statusOptions={['all', 'pending', 'preparing', 'ready']}
          />

          <div className="orders-grid">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
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
                id={`order-${order.id}`}
                order={normaliseOrder(order)}
                onUpdateStatus={handleUpdateOrderStatus}
                isHistory={false}
                drinks={drinks}
                drinksLoading={drinksLoading}
              />
            ))
          )}
        </div>

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
          title={pinModalMode === 'find' ? 'Complete Order by PIN' : 'PIN Required for Order Completion'}
          message={pinModalMode === 'find' 
            ? 'Enter your order PIN to find and complete an order:'
            : `Please enter PIN to complete order ${pendingCompletionOrder?.orderNumber || `#${pendingCompletionOrder?.id}`}:`
          }
        />
      </div>
    </div>
  );
};

export default OrdersPage;