import React, { useState, useEffect } from 'react';
import '../styles/Pages.css';
import OrderCard from '../components/OrderCard';
import FilterControls from '../components/FilterControls';
import OTPModal from '../components/OTPModal';
import { Lock as LockIcon } from '@mui/icons-material';
import {
  ORDER_STATUSES,
  filterOrdersByStatus,
  filterOrdersBySearch,
  getActiveOrderStatusCounts
} from '../utils/OrderUtils';
import {
  getMockActiveOrders,
  updateOrderStatus
} from '../services/OrderService';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // PIN Authentication Modal state
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingCompletionOrder, setPendingCompletionOrder] = useState(null);
  const [pinModalMode, setPinModalMode] = useState('complete'); // 'complete' or 'find'

  // Load mock data
  useEffect(() => {
    const mockOrders = getMockActiveOrders();
    setOrders(mockOrders);
    setFilteredOrders(mockOrders);
  }, []);

  // Filter orders based on status and search term - exclude completed and cancelled
  useEffect(() => {
    let filtered = orders.filter(order => 
      ![ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED].includes(order.status)
    );

    filtered = filterOrdersByStatus(filtered, statusFilter);
    filtered = filterOrdersBySearch(filtered, searchTerm);

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm]);

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    // If trying to complete an order (READY -> COMPLETED), show PIN modal
    if (newStatus === ORDER_STATUSES.COMPLETED) {
      const order = orders.find(o => o.id === orderId);
      if (order && order.status === ORDER_STATUSES.READY) {
        setPendingCompletionOrder(order);
        setPinModalMode('complete');
        setPinModalOpen(true);
        return; // Don't update status yet, wait for PIN confirmation
      }
    }
    
    // For all other status updates, proceed normally
    updateOrderStatus(orders, setOrders, orderId, newStatus);
  };

  // Handle PIN authentication result
  const handlePinConfirmation = (isConfirmed, order = null) => {
    if (isConfirmed) {
      if (pinModalMode === 'complete' && pendingCompletionOrder) {
        // Complete the specific order that was pending
        updateOrderStatus(orders, setOrders, pendingCompletionOrder.id, ORDER_STATUSES.COMPLETED);
      } else if (pinModalMode === 'find' && order) {
        // Complete the order found by PIN
        updateOrderStatus(orders, setOrders, order.id, ORDER_STATUSES.COMPLETED);
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
              >
                <LockIcon /> Complete Order by PIN ({readyOrdersCount} ready)
              </button>
            </div>
          )}
        </div>

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
            </div>
          ) : (
            filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateStatus={handleUpdateOrderStatus}
                isHistory={false}
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
            : `Please enter PIN to complete order ${pendingCompletionOrder?.orderNumber}:`
          }
        />
      </div>
    </div>
  );
};

export default OrdersPage;