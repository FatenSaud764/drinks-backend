import React, { useState, useEffect } from 'react';
import '../styles/Pages.css';
import OrderCard from '../components/OrderCard';
import FilterControls from '../components/FilterControls';
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
    updateOrderStatus(orders, setOrders, orderId, newStatus);
  };

  const statusCounts = getActiveOrderStatusCounts(orders);
  const statusOptions = ['all', 'pending', 'preparing', 'ready'];

  return (
    <div className="page">
      <div className="page-container">
        <div className="page-header">
          <h1>Active Orders</h1>
          <p>Manage active orders and update status in real-time</p>
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
      </div>
    </div>
  );
};

export default OrdersPage;