import React from 'react';
import {
  formatTime,
  formatCurrency,
  canMoveToPrevious,
  canMoveToNext,
  getPreviousStatus,
  getNextStatus,
  getStatusOptions,
  notifyClientReminder
} from '../utils/OrderUtils';
import { useInventory } from '../hooks/useInventory';
import '../styles/OrderCard.css';

const OrderCard = ({ 
  order, 
  onUpdateStatus, 
  isHistory = false 
}) => {
  // Use the inventory hook to get drink data
  const { drinks } = useInventory();

  // Helper function to get drink details by ID
  const getDrinkById = (drinkId) => {
    return drinks.find(drink => drink.id === drinkId);
  };

  return (
    <div className={`order-card ${isHistory ? 'history-card' : ''}`}>
      <div className="order-header">
        <div className="order-number">
          <h3>{order.orderNumber}</h3>
          <div className="order-timestamps">
            {isHistory ? (
              <>
                <span className="order-time">Ordered: {formatTime(order.orderTime)}</span>
                <span className="updated-time">
                  {order.status === 'completed' ? 'Completed' : 'Cancelled'}: {formatTime(order.lastUpdated)}
                </span>
              </>
            ) : (
              <span className="order-time">{formatTime(order.orderTime)}</span>
            )}
          </div>
        </div>

        <div className={`status-badge status-${order.status}`}>
          {order.status.toUpperCase()}
        </div>
      </div>

      <div className="order-items">
        <h4>Items:</h4>
        <div className="items-list">
          {order.items.map((item, index) => {
            const drink = getDrinkById(item.drink_id);
            const itemName = drink?.name || 'Unknown Item';
            const itemPrice = drink?.price || 0;
            
            return (
              <div key={index} className="item-row">
                <span>{item.quantity}x {itemName}</span>
                <span>{formatCurrency(itemPrice * item.quantity)}</span>
              </div>
            );
          })}
        </div>
        <div className="total-row">
          <span><strong>Total:</strong></span>
          <span className="total-amount"><strong>{formatCurrency(order.totalAmount)}</strong></span>
        </div>
        
        {/* Customer note to be displayed here */}
        {order.note && order.note.trim() && (
          <div className="order-note">
            <div className="note-label">Customer Note:</div>
            <div className="note-content">{order.note}</div>
          </div>
        )}
      </div>

      {!isHistory ? (
        <ActiveOrderActions order={order} onUpdateStatus={onUpdateStatus} />
      ) : (
        <HistoryOrderActions order={order} onUpdateStatus={onUpdateStatus} />
      )}
    </div>
  );
};

const ActiveOrderActions = ({ order, onUpdateStatus }) => {
  return (
    <div className="order-actions">
      <div className="status-navigation">
        <div className="nav-controls">
          <button
            className="nav-button prev"
            disabled={!canMoveToPrevious(order.status)}
            onClick={() => onUpdateStatus(order.id, getPreviousStatus(order.status))}
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
            onClick={() => onUpdateStatus(order.id, getNextStatus(order.status))}
            title={`Move forward to ${getNextStatus(order.status) || 'next status'}`}
          >
            {getNextStatus(order.status) ? getNextStatus(order.status).charAt(0).toUpperCase() + getNextStatus(order.status).slice(1) : 'Next'} &#8250;
          </button>
        </div>
      </div>

      {getStatusOptions(order.status).length > 0 && (
        <div className="status-actions">
          <div className="action-buttons">
            {getStatusOptions(order.status).map(statusOption => (
              <button
                key={statusOption}
                className={`status-button status-${statusOption}`}
                onClick={() => onUpdateStatus(order.id, statusOption)}
              >
                Mark as {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {order.status === 'ready' && (
        <button 
          className="notify-button"
          onClick={() => notifyClientReminder(order.id)}
          title="Remind customer to collect their order"
        >
          Remind Customer
        </button>
      )}
    </div>
  );
};

const HistoryOrderActions = ({ order, onUpdateStatus }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="history-actions">
      <div className="order-date">
        <span className="date-label">Date:</span>
        <span className="date-value">{formatDate(order.lastUpdated)}</span>
      </div>
      
      <div className="action-buttons-group">
        {order.status === 'cancelled' && (
          <button 
            className="restore-button"
            onClick={() => {onUpdateStatus(order.id);}}
          >
            Restore Order
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderCard;