/**
 * @author Kirsten Sanders
 * @description This is the InventoryPage component for the admin interface.
 * It allows viewing and managing the drink inventory with options to add, edit,
 * delete drinks, and update global stock thresholds.
*/

import { useState, useMemo, useEffect } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { useInventory } from '../hooks/useInventory';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Pages.css';
import '../styles/InventoryPage.css';
import '../styles/Modal.css';
import { DRINK_CATEGORIES } from 'shared/types';
// Notifications
import { useSnackbar } from '../contexts/SnackbarContext';

const InventoryPage = () => {
  const { 
    drinks, 
    loading, 
    error, 
    createDrink, 
    toggleAvailability, 
    deleteDrink,
    updateDrink,
    updateGlobalLowStockThreshold,
    updateGlobalUnavailableThreshold,
    clearError
  } = useInventory();

  const { isAuthenticated } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [modalOpen, setModalOpen] = useState(false);
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [validationErrors, setValidationErrors] = useState({});
  const [tableState, setTableState] = useState({
    pagination: { pageSize: 10, pageIndex: 0 },
    sorting: [],
    globalFilter: ''
  });
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'available', 'unavailable', 'low-stock'
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    price: '',
    category: '',
    stock: '',
    description: '',
    image: null,
    imagePreview: null,
    low_stock_threshold: 10,
    unavailable_threshold: 5
  });

  const [thresholdData, setThresholdData] = useState({
    low_stock_threshold: 10,
    unavailable_threshold: 5
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValidationErrors(prev => ({
        ...prev,
        image: null
      }));

      setFormData(prev => ({ 
        ...prev, 
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const validateForm = (data) => {
    const errors = {};

    if (!data.name?.trim()) {
      errors.name = 'Drink name is required';
    }

    if (!data.price || parseFloat(data.price) < 0) {
      errors.price = 'Valid price is required';
    }

    if (!data.category?.trim()) {
      errors.category = 'Category is required';
    }

    if (!data.stock || parseInt(data.stock) < 0) {
      errors.stock = 'Valid stock quantity is required';
    }

    if (!data.low_stock_threshold || parseInt(data.low_stock_threshold) < 0) {
      errors.low_stock_threshold = 'Valid low stock threshold is required';
    }

    if (!data.unavailable_threshold || parseInt(data.unavailable_threshold) < 0) {
      errors.unavailable_threshold = 'Valid unavailable threshold is required';
    }

    if (parseInt(data.unavailable_threshold) >= parseInt(data.low_stock_threshold)) {
      errors.unavailable_threshold = 'Unavailable threshold must be less than low stock threshold';
    }

    // Image validation
    if (modalMode === 'add') {
      if (!data.image) {
        errors.image = 'An image is required for the drink';
      }
    } else if (modalMode === 'edit') {
      if (!data.image && !data.imagePreview) {
        errors.image = 'An image is required for the drink';
      }
    }

    return errors;
  };

  const validateThresholds = (data) => {
    const errors = {};

    if (!data.low_stock_threshold || parseInt(data.low_stock_threshold) < 0) {
      errors.low_stock_threshold = 'Valid low stock threshold is required';
    }

    if (!data.unavailable_threshold || parseInt(data.unavailable_threshold) < 0) {
      errors.unavailable_threshold = 'Valid unavailable threshold is required';
    }

    if (parseInt(data.unavailable_threshold) >= parseInt(data.low_stock_threshold)) {
      errors.unavailable_threshold = 'Unavailable threshold must be less than low stock threshold';
    }

    return errors;
  };

  const getStockStatus = (stock, lowThreshold, unavailableThreshold) => {
    if (stock <= unavailableThreshold) return 'unavailable';
    if (stock <= lowThreshold) return 'low-stock';
    return '';
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'image',
        header: 'Image',
        size: 80,
        Cell: ({ row }) => {
          let imageUrl = null;
          
          if (row.original.image) {
            if (typeof row.original.image === 'string') {
              imageUrl = row.original.image;
            } else if (row.original.image instanceof File) {
              imageUrl = URL.createObjectURL(row.original.image);
            }
          }
          
          return (
            <div className="image-cell">
              {imageUrl ? (
                <img 
                  src={`${imageUrl}`}
                  alt={row.original.name}
                  className="drink-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <div 
                className="no-image-placeholder" 
                style={{ display: imageUrl ? 'none' : 'block' }}
              >
                No Image
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 150,
        Cell: ({ row }) => (
          <div className="name-cell">
            <span className="drink-name">{row.original.name}</span>
            {row.original.category && (
              <span className="drink-category">{row.original.category}</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Price',
        size: 100,
        Cell: ({ cell }) => {
          const value = Number(cell.getValue());
          return <span className="price-cell">R{value?.toFixed(2) || '0.00'}</span>;
        },
      },
      {
        accessorKey: 'stock',
        header: 'Stock',
        size: 100,
        Cell: ({ row }) => {
          const stock = row.original.stock || 0;
          const lowThreshold = row.original.low_stock_threshold || 10;
          const unavailableThreshold = row.original.unavailable_threshold || 5;
          const statusClass = getStockStatus(stock, lowThreshold, unavailableThreshold);
          
          return (
            <div className="stock-info">
              <span className={`stock-cell ${statusClass}`}>
                {stock} units
              </span>
              <div className="threshold-info">
                <small>Low: {lowThreshold} | Unavail: {unavailableThreshold}</small>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'available',
        header: 'Status',
        size: 120,
        Cell: ({ row }) => {
          const isAvailable = row.original.available;
    
          return (
            <span className={`status-badge ${isAvailable ? 'available' : 'unavailable'}`}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </span>
          );
        }
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 200,
        Cell: ({ cell }) => (
          <div className="description-cell">
            {cell.getValue() || 'No description'}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 200,
        enableSorting: false,
        Cell: ({ row }) => (
          <div className="actions-cell">
            <button
              className={`action-btn toggle-btn ${row.original.available ? 'make-unavailable' : 'make-available'}`}
              onClick={() => handleToggleAvailability(row.original.id, row.original.available)}
            >
              {row.original.available ? 'Disable' : 'Enable'}
            </button>
            
            {isAuthenticated && (
              <>
                <button
                  className="action-btn edit-btn"
                  onClick={() => handleEditDrink(row.original)}
                >
                  Edit
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDeleteDrink(row.original.id)}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [isAuthenticated]
  );

  const clearForm = () => {
    if (formData.imagePreview && formData.imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    
    setFormData({
      id: null,
      name: '',
      price: '',
      category: '',
      stock: '',
      description: '',
      image: null,
      imagePreview: null,
      low_stock_threshold: 10,
      unavailable_threshold: 5
    });
    setValidationErrors({});
  };

  const openAddModal = () => {
    if (!isAuthenticated) {
      showSnackbar('Authentication required to add drinks', 'error');
      return;
    }
    clearForm();
    setModalMode('add');
    setModalOpen(true);
  };

  const openThresholdModal = () => {
    if (!isAuthenticated) {
      showSnackbar('Authentication required to update global thresholds', 'error');
      return;
    }
    setThresholdModalOpen(true);
  };

  const handleEditDrink = (drink) => {
    if (!isAuthenticated) {
      showSnackbar('Authentication required to edit drinks', 'error');
      return;
    }
    setFormData({ 
      ...drink,
      imagePreview: drink.image,
      low_stock_threshold: drink.low_stock_threshold || 10,
      unavailable_threshold: drink.unavailable_threshold || 5
    });
    setModalMode('edit');
    setModalOpen(true);
    setValidationErrors({});
  };

  const closeModal = () => {
    setModalOpen(false);
    clearForm();
  };

  const closeThresholdModal = () => {
    setThresholdModalOpen(false);
    setValidationErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      showSnackbar('Authentication required', 'error');
      closeModal();
      return;
    }
    
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const stockValue = parseInt(formData.stock);
      const unavailableThreshold = parseInt(formData.unavailable_threshold);
      
      const drinkData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        image: formData.image,
        price: parseFloat(formData.price),
        category: formData.category.trim(),
        available: stockValue > unavailableThreshold,
        stock: stockValue,
        low_stock_threshold: parseInt(formData.low_stock_threshold),
        unavailable_threshold: unavailableThreshold
      };

      if (modalMode === 'add') {
        await createDrink(drinkData);
        showSnackbar(`Drink "${drinkData.name}" added successfully!`, 'success');
      } else {
        await updateDrink(formData.id, drinkData);
        showSnackbar(`"${drinkData.name}" updated successfully!`, 'success');
      }
      
      closeModal();
    } catch (err) {
      showSnackbar(`Failed to ${modalMode} drink: ${err.message}`, 'error');
    }
  };

  const handleThresholdSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      showSnackbar('Authentication required', 'error');
      closeThresholdModal();
      return;
    }

    const errors = validateThresholds(thresholdData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await updateGlobalLowStockThreshold(parseInt(thresholdData.low_stock_threshold));
      await updateGlobalUnavailableThreshold(parseInt(thresholdData.unavailable_threshold));
      showSnackbar('Global thresholds updated successfully!', 'success');
      closeThresholdModal();
    } catch (err) {
      showSnackbar(`Failed to update thresholds: ${err.message}`, 'error');
    }
  };

  const handleToggleAvailability = async (drinkId, currentAvailability) => {
    try {
      const drink = drinks.find(d => d.id === drinkId);
      await toggleAvailability(drinkId, !currentAvailability);
      const status = currentAvailability ? 'disabled' : 'enabled';
      showSnackbar(`"${drink?.name || 'Drink'}" ${status} successfully!`, 'success');
    } catch (err) {
      showSnackbar(`Failed to toggle availability: ${err.message}`, 'error');
    }
  };

  const handleDeleteDrink = async (drinkId) => {
    if (!isAuthenticated) {
      showSnackbar('Authentication required to delete drinks', 'error');
      return;
    }
    
    const drink = drinks.find(d => d.id === drinkId);
    const drinkName = drink ? drink.name : `drink ID ${drinkId}`;
    
    if (window.confirm(`Are you sure you want to delete "${drinkName}"?`)) {
      try {
        await deleteDrink(drinkId);
        showSnackbar(`"${drinkName}" deleted successfully!`, 'success');
      } catch (err) {
        console.error('Failed to delete drink:', err);
        showSnackbar(`Failed to delete drink: ${err.message}`, 'error');
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleThresholdChange = (field, value) => {
    setThresholdData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Calculate stats using dynamic thresholds
  const stats = useMemo(() => {
    return {
      total: drinks.length,
      available: drinks.filter(d => (d.stock || 0) > (d.unavailable_threshold || 5)).length,
      unavailable: drinks.filter(d => (d.stock || 0) <= (d.unavailable_threshold || 5)).length,
      lowStock: drinks.filter(d => {
        const stock = d.stock || 0;
        const lowThreshold = d.low_stock_threshold || 10;
        const unavailableThreshold = d.unavailable_threshold || 5;
        // low stock if strictly above unavailable threshold but at or below low threshold
        return stock > unavailableThreshold && stock <= lowThreshold;
      }).length
    };
  }, [drinks]);

  // Filter drinks based on active filter
  const filteredDrinks = useMemo(() => {
    if (activeFilter === 'all') return drinks;
    
    return drinks.filter(d => {
      const stock = d.stock || 0;
      const lowThreshold = d.low_stock_threshold || 10;
      const unavailableThreshold = d.unavailable_threshold || 5;
      
      switch (activeFilter) {
        case 'available':
          return stock > unavailableThreshold;
        case 'unavailable':
          return stock <= unavailableThreshold;
        case 'low-stock':
          return stock > unavailableThreshold && stock <= lowThreshold;
        default:
          return true;
      }
    });
  }, [drinks, activeFilter]);

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    // Reset to first page when filter changes
    setTableState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, pageIndex: 0 }
    }));
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-container">
          <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Loading Inventory...</p>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-container">
        <div className="page-header">
          <h1>Inventory Management</h1>
          <p>Track and manage your inventory levels</p>
          {!isAuthenticated && (
            <div className="auth-notice">
              <strong>Note:</strong> Authentication required for adding, editing, and deleting drinks.
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <div className="error-content">
              <p>Error: {error}</p>
              <div className="error-actions">
                <button 
                  onClick={() => {
                    clearError();
                    refetch();
                  }}
                  className="btn-refresh-error"
                  disabled={loading}
                >
                  Retry
                </button>
                <button onClick={clearError} className="btn-clear-error">×</button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="inventory-stats">
          <div 
            className={`stat-card ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterClick('all')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-value total">{stats.total}</div>
            <div className="stat-label">Total Items</div>
          </div>
          <div 
            className={`stat-card ${activeFilter === 'available' ? 'active' : ''}`}
            onClick={() => handleFilterClick('available')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-value available">{stats.available}</div>
            <div className="stat-label">Available</div>
          </div>
          <div 
            className={`stat-card ${activeFilter === 'unavailable' ? 'active' : ''}`}
            onClick={() => handleFilterClick('unavailable')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-value unavailable">{stats.unavailable}</div>
            <div className="stat-label">Unavailable</div>
          </div>
          <div 
            className={`stat-card ${activeFilter === 'low-stock' ? 'active' : ''}`}
            onClick={() => handleFilterClick('low-stock')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-value low-stock">{stats.lowStock}</div>
            <div className="stat-label">Low Stock</div>
          </div>
        </div>

        {/* Control Buttons */}
        {isAuthenticated && (
          <div className="orders-controls drink-controls">
            <button className="notify-button" onClick={openAddModal}>
              Add New Drink
            </button>
            <button className="nav-button" onClick={openThresholdModal}>
              Global Thresholds
            </button>
          </div>
        )}

        {/* Loading indicator for updates */}
        {loading && drinks.length > 0 && (
          <div className="loading-indicator">
            <p>Updating inventory...</p>
          </div>
        )}

        {/* Material React Table */}
        <div className="orders-controls table-container">
          <MaterialReactTable
            columns={columns}
            data={filteredDrinks}
            enableGlobalFilter={true}
            enableColumnFilters={false}
            enableSorting={true}
            enablePagination={true}
            enableDensityToggle={false}
            enableFullScreenToggle={false}
            enableHiding={true}
            enableColumnActions={false}
            enableTopToolbar={true}
            enableBottomToolbar={true}
            manualPagination={false}
            autoResetPageIndex={false}
            initialState={{
              pagination: tableState.pagination,
              sorting: tableState.sorting,
              globalFilter: tableState.globalFilter,
              showGlobalFilter: true,
            }}
            onPaginationChange={(updater) => {
              setTableState(prev => ({
                ...prev,
                pagination: typeof updater === 'function' ? updater(prev.pagination) : updater
              }));
            }}
            onSortingChange={(updater) => {
              setTableState(prev => ({
                ...prev,
                sorting: typeof updater === 'function' ? updater(prev.sorting) : updater
              }));
            }}
            onGlobalFilterChange={(filter) => {
              setTableState(prev => ({
                ...prev,
                globalFilter: filter
              }));
            }}
            muiSearchTextFieldProps={{
              placeholder: 'Search drinks...',
              variant: 'outlined',
              size: 'small',
            }}
            muiTablePaginationProps={{
              sx: {
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  color: 'var(--text-muted) !important',
                },
              },
            }}
            renderEmptyRowsFallback={() => (
              <div className="custom-empty-state">
                No records to display
              </div>
            )}
            state={{
              isLoading: loading,
              pagination: tableState.pagination,
              sorting: tableState.sorting,
              globalFilter: tableState.globalFilter,
            }}
          />
        </div>

        {/* Add/Edit Modal */}
        {modalOpen && isAuthenticated && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {modalMode === 'add' ? 'Add New Drink' : 'Edit Drink'}
                </h3>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="form-field">
                      <label htmlFor="drink-name" className="form-label">Drink Name</label>
                      <input
                        id="drink-name"
                        type="text"
                        placeholder="Enter drink name"
                        className={`search-input ${validationErrors.name ? 'error' : ''}`}
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                      {validationErrors.name && (
                        <div className="error-message">{validationErrors.name}</div>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="drink-price" className="form-label">Price (R)</label>
                      <input
                        id="drink-price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className={`search-input ${validationErrors.price ? 'error' : ''}`}
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        required
                      />
                      {validationErrors.price && (
                        <div className="error-message">{validationErrors.price}</div>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="drink-category" className="form-label">Category</label>
                      <select
                        id="drink-category"
                        className={`search-input ${validationErrors.category ? 'error' : ''}`}
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        required
                      >
                        <option value="">Select Category</option>
                        {Object.values(DRINK_CATEGORIES).map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      {validationErrors.category && (
                        <div className="error-message">{validationErrors.category}</div>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="drink-stock" className="form-label">Stock Quantity</label>
                      <input
                        id="drink-stock"
                        type="number"
                        min="0"
                        placeholder="0"
                        className={`search-input ${validationErrors.stock ? 'error' : ''}`}
                        value={formData.stock}
                        onChange={(e) => handleInputChange('stock', e.target.value)}
                        required
                      />
                      {validationErrors.stock && (
                        <div className="error-message">{validationErrors.stock}</div>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="low-stock-threshold" className="form-label">Low Stock Threshold</label>
                      <input
                        id="low-stock-threshold"
                        type="number"
                        min="1"
                        placeholder="10"
                        className={`search-input ${validationErrors.low_stock_threshold ? 'error' : ''}`}
                        value={formData.low_stock_threshold}
                        onChange={(e) => handleInputChange('low_stock_threshold', e.target.value)}
                        required
                      />
                      {validationErrors.low_stock_threshold && (
                        <div className="error-message">{validationErrors.low_stock_threshold}</div>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="unavailable-threshold" className="form-label">Unavailable Threshold</label>
                      <input
                        id="unavailable-threshold"
                        type="number"
                        min="0"
                        placeholder="5"
                        className={`search-input ${validationErrors.unavailable_threshold ? 'error' : ''}`}
                        value={formData.unavailable_threshold}
                        onChange={(e) => handleInputChange('unavailable_threshold', e.target.value)}
                        required
                      />
                      {validationErrors.unavailable_threshold && (
                        <div className="error-message">{validationErrors.unavailable_threshold}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="form-field">
                    <label className="form-label">Drink Image</label>
                    <div className="image-upload-container">
                      <label htmlFor="image-upload" className={`image-upload-label ${validationErrors.image ? 'error' : ''}`}>
                        {formData.image ? 'Change Image' : 'Upload Image'}
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="image-upload-input"
                        onChange={handleImageUpload}
                      />
                      {validationErrors.image && (
                        <div className="error-message">{validationErrors.image}</div>
                      )}
                      {(formData.imagePreview || formData.image) && (
                        <div className="image-edit-container">
                          <img 
                            src={
                              formData.imagePreview && formData.imagePreview.startsWith('blob:') 
                                ? formData.imagePreview 
                                : formData.imagePreview 
                                  ? `${formData.imagePreview}`
                                  : `${formData.image}`
                            } 
                            alt="Preview" 
                            className="image-preview"
                          />
                          <button
                            type="button"
                            className="nav-button"
                            onClick={() => {
                              if (formData.imagePreview && formData.imagePreview.startsWith('blob:')) {
                                URL.revokeObjectURL(formData.imagePreview);
                              }
                              setFormData(prev => ({ 
                                ...prev, 
                                image: null, 
                                imagePreview: null
                              }));
                            }}
                          >
                            Remove Image
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="drink-description" className="form-label">Description</label>
                    <textarea
                      id="drink-description"
                      placeholder="Enter drink description"
                      className="search-input form-textarea"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows="3"
                    />
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button type="button" className="nav-button" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="notify-button">
                    {modalMode === 'add' ? 'Add Drink' : 'Update Drink'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Threshold Modal */}
        {thresholdModalOpen && isAuthenticated && (
          <div className="modal-overlay" onClick={closeThresholdModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Global Threshold Settings</h3>
                <button className="modal-close" onClick={closeThresholdModal}>×</button>
              </div>

              <form onSubmit={handleThresholdSubmit} className="modal-form">
                <div className="modal-body">
                  <div className="threshold-description">
                    <p>These settings will update the default thresholds for all drinks.</p>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-field">
                      <label htmlFor="global-low-stock" className="form-label">Global Low Stock Threshold</label>
                      <input
                        id="global-low-stock"
                        type="number"
                        min="1"
                        placeholder="10"
                        className={`search-input ${validationErrors.low_stock_threshold ? 'error' : ''}`}
                        value={thresholdData.low_stock_threshold}
                        onChange={(e) => handleThresholdChange('low_stock_threshold', e.target.value)}
                        required
                      />
                      {validationErrors.low_stock_threshold && (
                        <div className="error-message">{validationErrors.low_stock_threshold}</div>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="global-unavailable" className="form-label">Global Unavailable Threshold</label>
                      <input
                        id="global-unavailable"
                        type="number"
                        min="0"
                        placeholder="5"
                        className={`search-input ${validationErrors.unavailable_threshold ? 'error' : ''}`}
                        value={thresholdData.unavailable_threshold}
                        onChange={(e) => handleThresholdChange('unavailable_threshold', e.target.value)}
                        required
                      />
                      {validationErrors.unavailable_threshold && (
                        <div className="error-message">{validationErrors.unavailable_threshold}</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button type="button" className="nav-button" onClick={closeThresholdModal}>
                    Cancel
                  </button>
                  <button type="submit" className="notify-button">
                    Update Global Thresholds
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;