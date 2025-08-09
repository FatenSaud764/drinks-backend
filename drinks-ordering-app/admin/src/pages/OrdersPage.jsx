import React, { useState, useEffect } from 'react';
import '../styles/Pages.css';
// Toast alerts for undo and notification system
import { toast } from 'react-toastify';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Enhanced mock data with more orders for better grid demonstration
  useEffect(() => {
    const mockOrders = [
      {
        id: 1,
        orderNumber: 'ORD-001',
        items: [
          { name: 'Pina Colada', quantity: 2, price: 75.00 },
          { name: 'Black Label', quantity: 1, price: 40.00 }
        ],
        totalAmount: 190,
        status: 'pending',
        orderTime: new Date('2024-08-08T09:30:00'),
      },
      {
        id: 2,
        orderNumber: 'ORD-002',
        items: [
          { name: 'Castle Lager', quantity: 1, price: 38.50 },
        ],
        totalAmount: 38.50,
        status: 'preparing',
        orderTime: new Date('2024-08-08T10:15:00'),
      },
      {
        id: 3,
        orderNumber: 'ORD-003',
        items: [
          { name: 'Espresso Martini', quantity: 3, price: 85.50 },
        ],
        totalAmount: 256.50,
        status: 'ready',
        orderTime: new Date('2024-08-08T11:00:00'),
      },
      {
        id: 4,
        orderNumber: 'ORD-004',
        items: [
          { name: 'Coke', quantity: 1, price: 18.90 }
        ],
        totalAmount: 18.90,
        status: 'completed',
        orderTime: new Date('2024-08-08T08:45:00'),
      },
      {
        id: 5,
        orderNumber: 'ORD-005',
        items: [
          { name: 'Whiskey Sour', quantity: 2, price: 92.00 },
          { name: 'Aperol Spritz', quantity: 1, price: 68.00 }
        ],
        totalAmount: 252.00,
        status: 'preparing',
        orderTime: new Date('2024-08-08T11:30:00'),
      },
      {
        id: 6,
        orderNumber: 'ORD-006',
        items: [
          { name: 'Red Wine Glass', quantity: 2, price: 55.00 }
        ],
        totalAmount: 110.00,
        status: 'ready',
        orderTime: new Date('2024-08-08T12:00:00'),
      },
      {
        id: 7,
        orderNumber: 'ORD-007',
        items: [
          { name: 'Mojito', quantity: 3, price: 72.00 },
          { name: 'Gin & Tonic', quantity: 2, price: 58.00 }
        ],
        totalAmount: 332.00,
        status: 'pending',
        orderTime: new Date('2024-08-08T12:30:00'),
      },
      {
        id: 8,
        orderNumber: 'ORD-008',
        items: [
          { name: 'Beer Flight', quantity: 1, price: 120.00 }
        ],
        totalAmount: 120.00,
        status: 'preparing',
        orderTime: new Date('2024-08-08T13:00:00'),
      }
    ];
    setOrders(mockOrders);
    setFilteredOrders(mockOrders);
  }, []);

  // Filter orders based on status and search term
  useEffect(() => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm]);

  const updateOrderStatus = (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId);

    // Update the order immediately
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    // Show confirmation toast and send notification
    toast.success(`${order.orderNumber} updated to ${newStatus.toUpperCase()}`);
    notifyClient(orderId, newStatus);
  };

  const notifyClient = (orderId, status) => {
    // Replace with actual notification system - API call
    const order = orders.find(o => o.id === orderId);
    toast.success(`Notification sent: Order ${order?.orderNumber} is now ${status.toUpperCase()}`);
  };

  const getStatusFlow = () => {
    return ['pending', 'preparing', 'ready', 'completed'];
  };

  const getCurrentStatusIndex = (status) => {
    const flow = getStatusFlow();
    return flow.indexOf(status);
  };

  const canMoveToPrevious = (status) => {
    const currentIndex = getCurrentStatusIndex(status);
    return currentIndex > 0 && status !== 'cancelled';
  };

  const canMoveToNext = (status) => {
    const flow = getStatusFlow();
    const currentIndex = getCurrentStatusIndex(status);
    return currentIndex < flow.length - 1 && currentIndex !== -1 && status !== 'cancelled';
  };

  const getPreviousStatus = (status) => {
    const flow = getStatusFlow();
    const currentIndex = getCurrentStatusIndex(status);
    return currentIndex > 0 ? flow[currentIndex - 1] : null;
  };

  const getNextStatus = (status) => {
    const flow = getStatusFlow();
    const currentIndex = getCurrentStatusIndex(status);
    return currentIndex < flow.length - 1 && currentIndex !== -1 ? flow[currentIndex + 1] : null;
  };

  const getStatusOptions = (currentStatus) => {
    // Keep cancel option available for pending and preparing orders
    const cancelOptions = ['pending', 'preparing'].includes(currentStatus) ? ['cancelled'] : [];
    return cancelOptions;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCurrency = (amount) => {
    return `R${amount.toFixed(2)}`;
  };

  const getStatusCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter(order => order.status === 'pending').length,
      preparing: orders.filter(order => order.status === 'preparing').length,
      ready: orders.filter(order => order.status === 'ready').length,
      completed: orders.filter(order => order.status === 'completed').length,
      cancelled: orders.filter(order => order.status === 'cancelled').length
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="page">
      <div className="page-container">
        <div className="page-header">
          <h1>Orders Management</h1>
          <p>Manage active orders and update status in real-time</p>
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
          
          <div className="filter-tabs">
            {['all', 'pending', 'preparing', 'ready', 'completed'].map(status => (
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
        </div>

        <div className="orders-grid">
          {filteredOrders.length === 0 ? (
            <div className="no-orders">
              <h3>No orders found</h3>
              <p>No orders match your current search criteria.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-number">
                    <h3>{order.orderNumber}</h3>
                    <span className="order-time">{formatTime(order.orderTime)}</span>
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

                <div className="order-actions">
                  <div className="status-navigation">
                    <div className="nav-controls">
                      <button
                        className="nav-button prev"
                        disabled={!canMoveToPrevious(order.status)}
                        onClick={() => updateOrderStatus(order.id, getPreviousStatus(order.status))}
                        title={`Move back to ${getPreviousStatus(order.status) || 'previous status'}`}
                      >
                        &#8249; {getPreviousStatus(order.status) ? getPreviousStatus(order.status).charAt(0).toUpperCase() + getPreviousStatus(order.status).slice(1) : 'Previous'}
                      </button>
                      
                      <div className="current-status">
                        <span className="status-label">Status</span>
                        <span className={`status-display status-${order.status}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <button
                        className="nav-button next"
                        disabled={!canMoveToNext(order.status)}
                        onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                        title={`Move forward to ${getNextStatus(order.status) || 'next status'}`}
                      >
                        {getNextStatus(order.status) ? getNextStatus(order.status).charAt(0).toUpperCase() + getNextStatus(order.status).slice(1) : 'Next'} &#8250;
                      </button>
                    </div>
                  </div>

                  {getStatusOptions(order.status).length > 0 && (
                    <div className="status-actions">
                      <label>Other Actions:</label>
                      <div className="action-buttons">
                        {getStatusOptions(order.status).map(statusOption => (
                          <button
                            key={statusOption}
                            className={`status-button status-${statusOption}`}
                            onClick={() => updateOrderStatus(order.id, statusOption)}
                          >
                            Mark as {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button 
                    className="notify-button"
                    onClick={() => notifyClient(order.id, order.status)}
                  >
                    Send Notification
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;