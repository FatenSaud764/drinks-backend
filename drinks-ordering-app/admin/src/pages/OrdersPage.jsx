import React, { useState, useEffect } from 'react';
import '../styles/Pages.css';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [undoAction, setUndoAction] = useState(null);
  const [undoTimer, setUndoTimer] = useState(null);

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
    const previousStatus = order.status;

    // Store undo information
    const undoInfo = {
      orderId,
      previousStatus,
      newStatus,
      orderNumber: order.orderNumber
    };

    // Update the order immediately
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    // Clear any existing undo timer
    if (undoTimer) {
      clearTimeout(undoTimer);
    }

    // Set up undo action with 5-second timer
    setUndoAction(undoInfo);
    const timer = setTimeout(() => {
      setUndoAction(null);
      // Send notification to client after undo window expires
      notifyClient(orderId, newStatus);
    }, 5000);

    setUndoTimer(timer);
  };

  const executeUndo = () => {
    if (undoAction) {
      // Revert the status change
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === undoAction.orderId 
            ? { ...order, status: undoAction.previousStatus } 
            : order
        )
      );

      // Clear undo timer and action
      if (undoTimer) {
        clearTimeout(undoTimer);
      }
      setUndoAction(null);
      setUndoTimer(null);
    }
  };

  const notifyClient = (orderId, status) => {
    // Replace with actual notification system - API call
    const order = orders.find(o => o.id === orderId);
    alert(`Notification sent: Order ${order?.orderNumber} is now ${status.toUpperCase()}`);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      preparing: '#2196f3',
      ready: '#4caf50',
      completed: '#9e9e9e',
      cancelled: '#f44336'
    };
    return colors[status] || '#9e9e9e';
  };

  const getStatusOptions = (currentStatus) => {
    const statusFlow = {
      pending: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['completed'],
      completed: [],
      cancelled: []
    };
    return statusFlow[currentStatus] || [];
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

        {/* Undo Toast Notification */}
        {undoAction && (
          <div className="undo-toast" style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#333',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>
              Changed {undoAction.orderNumber} from {undoAction.previousStatus} to {undoAction.newStatus}
            </span>
            <button 
              onClick={executeUndo}
              style={{
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              UNDO
            </button>
          </div>
        )}

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
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
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
                  {getStatusOptions(order.status).length > 0 && (
                    <div className="status-actions">
                      <label>Update Status:</label>
                      <div className="action-buttons">
                        {getStatusOptions(order.status).map(statusOption => (
                          <button
                            key={statusOption}
                            className={`status-button ${statusOption}`}
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