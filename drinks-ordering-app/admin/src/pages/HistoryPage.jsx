import React, { useState, useEffect } from 'react';
import '../styles/Pages.css';
import { toast } from 'react-toastify';

const HistoryPage = () => {
  const [historyOrders, setHistoryOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    // This would be an API call to fetch historical orders
    // For now, I just get from localStorage
    const mockHistoryOrders = [
      {
        id: 4,
        orderNumber: 'ORD-004',
        items: [
          { name: 'Coke', quantity: 1, price: 18.90 }
        ],
        totalAmount: 18.90,
        status: 'completed',
        orderTime: new Date('2024-08-08T08:45:00'),
        lastUpdated: new Date('2024-08-08T09:00:00'),
        completedAt: new Date('2024-08-08T09:00:00'),
      },
      {
        id: 9,
        orderNumber: 'ORD-009',
        items: [
          { name: 'Margarita', quantity: 2, price: 78.00 }
        ],
        totalAmount: 156.00,
        status: 'cancelled',
        orderTime: new Date('2024-08-07T14:30:00'),
        lastUpdated: new Date('2024-08-07T14:45:00'),
        cancelledAt: new Date('2024-08-07T14:45:00'),
      },
      {
        id: 10,
        orderNumber: 'ORD-010',
        items: [
          { name: 'Craft Beer', quantity: 3, price: 45.00 },
          { name: 'Nachos', quantity: 1, price: 85.00 }
        ],
        totalAmount: 220.00,
        status: 'completed',
        orderTime: new Date('2024-08-07T16:15:00'),
        lastUpdated: new Date('2024-08-07T17:00:00'),
        completedAt: new Date('2024-08-07T17:00:00'),
      }
    ];

    // Get orders from localStorage (moved from active orders)
    const storedHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    
    // Combine mock data with stored history
    const allHistoryOrders = [...storedHistory, ...mockHistoryOrders];
    
    // Sort by most recent first
    allHistoryOrders.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    
    setHistoryOrders(allHistoryOrders);
    setFilteredOrders(allHistoryOrders);
  }, []);

  // Filter orders based on status, search term, and date
  useEffect(() => {
    let filtered = historyOrders;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.lastUpdated);
        switch(dateFilter) {
          case 'today':
            return orderDate >= today;
          case 'yesterday':
            return orderDate >= yesterday && orderDate < today;
          case 'week':
            return orderDate >= weekAgo;
          default:
            return true;
        }
      });
    }

    setFilteredOrders(filtered);
  }, [historyOrders, statusFilter, searchTerm, dateFilter]);

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all order history? This action cannot be undone.')) {
      localStorage.removeItem('orderHistory');
      setHistoryOrders(historyOrders.filter(order => [4, 9, 10].includes(order.id))); // Keep mock data
      toast.success('Order history cleared');
    }
  };

  const restoreOrder = (orderId) => {
    // This would typically be an API call to restore an order
    const order = historyOrders.find(o => o.id === orderId);
    if (order && order.status === 'cancelled') {
      // Move back to active orders with pending status
      const restoredOrder = {
        ...order,
        status: 'pending',
        lastUpdated: new Date()
      };
      
      // Remove from history
      const updatedHistory = historyOrders.filter(o => o.id !== orderId);
      setHistoryOrders(updatedHistory);
      
      // In a real app, this would be an API call to move the order back to active
      toast.success(`${order.orderNumber} restored to active orders`);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `R${amount.toFixed(2)}`;
  };

  const getStatusCounts = () => {
    return {
      all: historyOrders.length,
      completed: historyOrders.filter(order => order.status === 'completed').length,
      cancelled: historyOrders.filter(order => order.status === 'cancelled').length,
    };
  };

  const notifyCustomer = (orderId) => {
    // Notify customer to collect their completed order
    const order = historyOrders.find(o => o.id === orderId);
    toast.success(`Reminder sent: ${order?.orderNumber} is ready for collection`);
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="page">
      <div className="page-container">
        <div className="page-header">
          <h1>Order History</h1>
          <p>View completed and cancelled orders</p>
        </div>

        <div className="orders-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by order number or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-section">
            <div className="filter-tabs">
              {['all', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  className={`filter-tab ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="count">
                    {statusCounts[status]}
                  </span>
                </button>
              ))}
            </div>

            <div className="date-filter">
              <select 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)}
                className="date-select"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Past Week</option>
              </select>
            </div>

            <button 
              className="clear-history-button"
              onClick={clearHistory}
              title="Clear all order history"
            >
              Clear History
            </button>
          </div>
        </div>

        <div className="orders-grid">
          {filteredOrders.length === 0 ? (
            <div className="no-orders">
              <h3>No historical orders found</h3>
              <p>No orders match your current search criteria.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="order-card history-card">
                <div className="order-header">
                  <div className="order-number">
                    <h3>{order.orderNumber}</h3>
                    <div className="order-timestamps">
                      <span className="order-time">Ordered: {formatTime(order.orderTime)}</span>
                      <span className="updated-time">
                        {order.status === 'completed' ? 'Completed' : 'Cancelled'}: {formatTime(order.lastUpdated)}
                      </span>
                    </div>
                  </div>
                  <div className={`status-badge status-${order.status}`}>
                    {order.status.toUpperCase()}
                  </div>
                </div>

                <div className="order-items">
                  <h4>Items:</h4>
                  {order.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="total-row">
                    <span><strong>Total:</strong></span>
                    <span className="total-amount"><strong>{formatCurrency(order.totalAmount)}</strong></span>
                  </div>
                </div>

                <div className="history-actions">
                  <div className="order-date">
                    <span className="date-label">Date:</span>
                    <span className="date-value">{formatDate(order.lastUpdated)}</span>
                  </div>
                  
                  <div className="action-buttons-group">
                    {order.status === 'completed' && (
                        <button 
                          className="notify-button"
                          onClick={() => notifyCustomer(order.id)}
                          title="Remind customer to collect their completed order"
                        >
                          Remind Customer
                        </button>
                      )}

                    {order.status === 'cancelled' && (
                      <button 
                        className="restore-button"
                        onClick={() => restoreOrder(order.id)}
                        title="Restore this cancelled order to active orders"
                      >
                        Restore Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;