/**
 * @author Kirsten Sanders
 * @description This file contains the skeleton for cards when the page is in the loading state.
*/

import '../styles/SkeletonCard.css';

const SkeletonCard = () => {
  return (
    <div className="order-card skeleton-card">
      {/* Order Header */}
      <div className="order-header skeleton-header">
        <div className="skeleton-order-info">
          <div className="skeleton skeleton-order-number"></div>
          <div className="skeleton skeleton-time"></div>
        </div>
        <div className="skeleton skeleton-status"></div>
      </div>

      {/* Order Items Section */}
      <div className="order-items skeleton-items-section">
        <div className="skeleton skeleton-items-title"></div>
        
        <div className="skeleton-items-list">
          <div className="skeleton-item-row">
            <div className="skeleton skeleton-item-name"></div>
            <div className="skeleton skeleton-item-price"></div>
            <div className="skeleton skeleton-item-total"></div>
          </div>
          <div className="skeleton-item-row">
            <div className="skeleton skeleton-item-name"></div>
            <div className="skeleton skeleton-item-price"></div>
            <div className="skeleton skeleton-item-total"></div>
          </div>
          <div className="skeleton-item-row short">
            <div className="skeleton skeleton-item-name"></div>
            <div className="skeleton skeleton-item-price"></div>
            <div className="skeleton skeleton-item-total"></div>
          </div>
        </div>
        
        <div className="skeleton-total-row">
          <div className="skeleton skeleton-total-label"></div>
          <div className="skeleton skeleton-total-amount"></div>
        </div>
      </div>

      {/* Order Actions */}
      <div className="order-actions skeleton-actions">
        <div className="skeleton-nav-controls">
          <div className="skeleton skeleton-nav-button"></div>
          <div className="skeleton skeleton-current-status"></div>
          <div className="skeleton skeleton-nav-button"></div>
        </div>
        
        <div className="skeleton-action-buttons">
          <div className="skeleton skeleton-action-button"></div>
          <div className="skeleton skeleton-action-button"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;