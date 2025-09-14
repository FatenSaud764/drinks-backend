/**
 * @author Kirsten Sanders
 * @description This component renders filter controls for the orders list: search, status tabs, date filter.
*/

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
      </div>
    </div>
  );
};

export default FilterControls;