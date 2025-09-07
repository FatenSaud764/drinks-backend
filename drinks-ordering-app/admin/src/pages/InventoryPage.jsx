import { useState, useMemo } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { useInventory } from '../hooks/useInventory';
import { useAuth } from '../contexts/AuthContext'; // Add auth import
import '../styles/Pages.css';
import '../styles/InventoryPage.css';
import '../styles/Modal.css';
import { DRINK_CATEGORIES } from 'shared/types';
// Notifications
import { useSnackbar } from '../contexts/SnackbarContext';

const LOW_STOCK_THRESHOLD = 10;
const UNAVAILABLE_THRESHOLD = 5;

const InventoryPage = () => {
  const { 
    drinks, 
    loading, 
    error, 
    createDrink, 
    toggleAvailability, 
    deleteDrink,
    updateDrink,
    clearError
  } = useInventory();

  const { isAuthenticated } = useAuth(); // Get auth state
  const { showSnackbar } = useSnackbar();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    price: '',
    category: '',
    stock: '',
    description: '',
    image: null,
    imagePreview: null
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Clear any image validation errors
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

    if (!data.price || parseFloat(data.price) <= 0) {
      errors.price = 'Valid price is required';
    }

    if (!data.category?.trim()) {
      errors.category = 'Category is required';
    }

    if (!data.stock || parseInt(data.stock) < 0) {
      errors.stock = 'Valid stock quantity is required';
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
                  src={`http://localhost:8000${imageUrl}`}
                  alt={row.original.name}
                  className="drink-image"
                  onError={(e) => {
                    console.log('Image failed to load:', imageUrl);
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
        Cell: ({ cell }) => {
          const stock = cell.getValue() || 0;
          return (
            <span className={`stock-cell ${stock < UNAVAILABLE_THRESHOLD ? 'unavailable' : stock < LOW_STOCK_THRESHOLD ? 'low-stock' : ''}`}>
              {stock} units
            </span>
          );
        },
      },
      {
        accessorKey: 'available',
        header: 'Status',
        size: 120,
        Cell: ({ cell }) => (
          <span className={`status-badge ${cell.getValue() ? 'available' : 'unavailable'}`}>
            {cell.getValue() ? 'Available' : 'Unavailable'}
          </span>
        ),
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
      // Always show actions column (availability toggle always available, edit/delete only for authenticated)
      {
        id: 'actions',
        header: 'Actions',
        size: 200,
        enableSorting: false,
        Cell: ({ row }) => (
          <div className="actions-cell">
            {/* Toggle availability - always available */}
            <button
              className={`action-btn toggle-btn ${row.original.available ? 'make-unavailable' : 'make-available'}`}
              onClick={() => handleToggleAvailability(row.original.id, row.original.available)}
            >
              {row.original.available ? 'Disable' : 'Enable'}
            </button>
            
            {/* Edit and Delete - only for authenticated users */}
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
    [isAuthenticated] // Add isAuthenticated as dependency
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
      imagePreview: null
    });
    setValidationErrors({});
  };

  const openAddModal = () => {
    // Check authentication before allowing add
    if (!isAuthenticated) {
      showSnackbar('Authentication required to add drinks', 'error');
      return;
    }
    clearForm();
    setModalMode('add');
    setModalOpen(true);
  };

  const handleEditDrink = (drink) => {
    // Check authentication before allowing edit
    if (!isAuthenticated) {
      showSnackbar('Authentication required to edit drinks', 'error');
      return;
    }
    setFormData({ 
      ...drink,
      imagePreview: drink.image // Use existing image as preview
    });
    setModalMode('edit');
    setModalOpen(true);
    setValidationErrors({});
  };

  const closeModal = () => {
    setModalOpen(false);
    clearForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Double-check authentication before submitting
    if (!isAuthenticated) {
      showSnackbar('Authentication required', 'error');
      closeModal();
      return;
    }
    
    // Validate form
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const stockValue = parseInt(formData.stock);
      const drinkData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        image: formData.image,
        price: parseFloat(formData.price),
        category: formData.category.trim(),
        available: stockValue >= 5,
        stock: stockValue,
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
      console.error(`Failed to ${modalMode} drink:`, err);
      showSnackbar(`Failed to ${modalMode} drink: ${err.message}`, 'error');
    }
  };

  const handleToggleAvailability = async (drinkId, currentAvailability) => {
    // Remove authentication check - allow all users to toggle availability
    try {
      const drink = drinks.find(d => d.id === drinkId);
      await toggleAvailability(drinkId, !currentAvailability);
      const status = currentAvailability ? 'disabled' : 'enabled';
      showSnackbar(`"${drink?.name || 'Drink'}" ${status} successfully!`, 'success');
    } catch (err) {
      console.error('Failed to toggle availability:', err);
      showSnackbar(`Failed to toggle availability: ${err.message}`, 'error');
    }
  };

  const handleDeleteDrink = async (drinkId) => {
    // Check authentication before allowing delete
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
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Show loading state only for initial load
  if (loading && drinks.length === 0) {
    return (
      <div className="page">
        <div className="page-container">
          <div className="loading-state">
            <h3>Loading inventory...</h3>
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
          {/* Update auth notice to be more specific */}
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
          <div className="stat-card">
            <div className="stat-value total">{drinks.length}</div>
            <div className="stat-label">Total Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-value available">{drinks.filter(d => d.available).length}</div>
            <div className="stat-label">Available</div>
          </div>
          <div className="stat-card">
            <div className="stat-value unavailable">{drinks.filter(d => !d.available).length}</div>
            <div className="stat-label">Unavailable</div>
          </div>
          <div className="stat-card">
            <div className="stat-value low-stock">{drinks.filter(d => (d.stock || 0) < LOW_STOCK_THRESHOLD).length}</div>
            <div className="stat-label">Low Stock</div>
          </div>
        </div>

        {/* Add Button - Only show if authenticated */}
        {isAuthenticated && (
          <div className="orders-controls">
            <button className="notify-button" onClick={openAddModal}>
              Add New Drink
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
            data={drinks}
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
            initialState={{
              pagination: { pageSize: 10, pageIndex: 0 },
              showGlobalFilter: true,
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
            }}
          />
        </div>

        {/* Add/Edit Modal - Only show if authenticated */}
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
                                  ? `http://localhost:8000${formData.imagePreview}`
                                  : `http://localhost:8000${formData.image}`
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
      </div>
    </div>
  );
};

export default InventoryPage;