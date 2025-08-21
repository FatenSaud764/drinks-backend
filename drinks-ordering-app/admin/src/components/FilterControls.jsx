import React from 'react';

const FilterControls = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  statusCounts,
  statusOptions,
  dateFilter,
  setDateFilter,
  showDateFilter = false,
  onClearHistory,
  showClearHistory = false
}) => {
  return (
    <div className="orders-controls">
      <div className="search-container">
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
          {statusOptions.map(status => (
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

        {showDateFilter && (
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
        )}

        {showClearHistory && (
          <button 
            className="clear-history-button"
            onClick={onClearHistory}
            title="Clear all order history"
          >
            Clear History
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterControls;