import React, { useState, useEffect } from 'react';
import '../styles/Pages.css';
import OrderCard from '../components/OrderCard';
import FilterControls from '../components/FilterControls';
import {
  filterOrdersByStatus,
  filterOrdersBySearch,
  filterOrdersByDate,
  getHistoryOrderStatusCounts
} from '../utils/OrderUtils';
import {
  getOrderHistory,
  clearOrderHistory,
  restoreOrder
} from '../services/OrderService';

const HistoryPage = () => {
  const [historyOrders, setHistoryOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    const allHistoryOrders = getOrderHistory();
    setHistoryOrders(allHistoryOrders);
    setFilteredOrders(allHistoryOrders);
  }, []);

  // Filter orders based on status, search term, and date
  useEffect(() => {
    let filtered = historyOrders;

    filtered = filterOrdersByStatus(filtered, statusFilter);
    filtered = filterOrdersBySearch(filtered, searchTerm);
    filtered = filterOrdersByDate(filtered, dateFilter);

    setFilteredOrders(filtered);
  }, [historyOrders, statusFilter, searchTerm, dateFilter]);

  const handleClearHistory = () => {
    clearOrderHistory(setHistoryOrders);
  };

  const handleRestoreOrder = (orderId) => {
    restoreOrder(historyOrders, setHistoryOrders, orderId);
  };

  const statusCounts = getHistoryOrderStatusCounts(historyOrders);
  const statusOptions = ['all', 'completed', 'cancelled'];

  return (
    <div className="page">
      <div className="page-container">
        <div className="page-header">
          <h1>Order History</h1>
          <p>View completed and cancelled orders</p>
        </div>

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
          onClearHistory={handleClearHistory}
          showClearHistory={true}
        />

        <div className="orders-grid">
          {filteredOrders.length === 0 ? (
            <div className="no-orders">
              <h3>No historical orders found</h3>
              <p>No orders match your current search criteria.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateStatus={handleRestoreOrder}
                isHistory={true}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;