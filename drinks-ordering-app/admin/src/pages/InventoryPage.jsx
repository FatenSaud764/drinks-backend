import { useState, useMemo, useRef, useEffect } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { useInventory } from '../hooks/useInventory';
import '../styles/Pages.css';
import '../styles/InventoryPage.css';

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
    updateDrink
  } = useInventory();

  // Refs for scrolling to forms
  const addFormRef = useRef(null);
  const editFormRef = useRef(null);

  const DRINK_CATEGORIES = [
    'Alcoholic',
    'Non-Alcoholic',
  ];

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDrink, setEditingDrink] = useState(null);
  const [newDrink, setNewDrink] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    description: '',
    image: null
  });

  // Auto-scroll to forms when they become visible
  useEffect(() => {
    if (showAddForm && addFormRef.current) {
      setTimeout(() => {
        addFormRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100); // Small delay to ensure form is rendered
    }
  }, [showAddForm]);

  useEffect(() => {
    if (editingDrink && editFormRef.current) {
      setTimeout(() => {
        editFormRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [editingDrink]);

  const handleImageUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isEdit && editingDrink) {
        setEditingDrink(prev => ({ 
          ...prev, 
          image: file,
          imagePreview: URL.createObjectURL(file)
        }));
      } else {
        setNewDrink(prev => ({ 
          ...prev, 
          image: file,
          imagePreview: URL.createObjectURL(file)
        }));
      }
    }
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
          </div>
        ),
      },
    ],
    []
  );

  const clearForm = () => {
    setNewDrink({ 
      name: '', 
      price: '', 
      category: '', 
      stock: '', 
      description: '', 
      image: null,
      imagePreview: null 
    });

    if (newDrink.imagePreview) {
      URL.revokeObjectURL(newDrink.imagePreview);
    }
  };

  const handleAddDrink = async (e) => {
    e.preventDefault();
    
    try {
      const stockValue = parseInt(newDrink.stock);
      await createDrink({
        name: newDrink.name.trim(),
        description: newDrink.description.trim(),
        image: newDrink.image,
        price: parseFloat(newDrink.price),
        category: newDrink.category.trim(),
        available: stockValue >= 5,
        stock: stockValue,
      });
      clearForm();
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to create drink:', err);
      alert(`Failed to create drink: ${err.message}`);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const stockValue = parseInt(editingDrink.stock);
      await updateDrink(editingDrink.id, {
        name: editingDrink.name.trim(),
        description: editingDrink.description.trim(),
        image: editingDrink.image,
        price: parseFloat(editingDrink.price),
        category: editingDrink.category.trim(),
        available: stockValue >= 5,
        stock: stockValue,
      });
      setEditingDrink(null);
    } catch (err) {
      console.error('Failed to update drink:', err);
      alert(`Failed to update drink: ${err.message}`);
    }
  };

  const handleToggleAvailability = async (drinkId, currentAvailability) => {
    try {
      await toggleAvailability(drinkId, !currentAvailability);
      console.log('Availability toggled successfully');
    } catch (err) {
      console.error('Failed to toggle availability:', err);
      alert(`Failed to toggle availability: ${err.message}`);
    }
  };

  const handleEditDrink = (drink) => {
    setEditingDrink({ ...drink });
    setShowAddForm(false);
  };

  const handleDeleteDrink = async (drinkId) => {
    if (window.confirm('Are you sure you want to delete this drink?')) {
      try {
        await deleteDrink(drinkId);
        console.log('Drink deleted successfully');
      } catch (err) {
        console.error('Failed to delete drink:', err);
        alert(`Failed to delete drink: ${err.message}`);
      }
    }
  };

  if (loading) return <div className="page"><div className="page-container">Loading inventory...</div></div>;
  if (error) return <div className="page"><div className="page-container">Error loading inventory: {error}</div></div>;

  return (
    <div className="page">
      <div className="page-container">
        <div className="page-header">
          <h1>Inventory Management</h1>
          <p>Track and manage your inventory levels</p>
        </div>

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

        {/* Add/Edit Buttons */}
        <div className="orders-controls">
          <button
            className="notify-button"
            onClick={() => {
              clearForm();
              setShowAddForm(!showAddForm);
              setEditingDrink(null);
            }}
          >
            {showAddForm ? 'Cancel' : 'Add New Drink'}
          </button>
          {editingDrink && (
            <button
              className="nav-button"
              onClick={() => setEditingDrink(null)}
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="orders-controls" ref={addFormRef}>
            <h3 className="form-title">Add New Drink</h3>
            <form onSubmit={handleAddDrink} className="add-drink-form">
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Drink name"
                  className="search-input"
                  value={newDrink.name}
                  onChange={(e) => setNewDrink(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  className="search-input"
                  value={newDrink.price}
                  onChange={(e) => setNewDrink(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
                <select
                  className="search-input"
                  value={newDrink.category}
                  onChange={(e) => setNewDrink(prev => ({ ...prev, category: e.target.value }))}
                  required
                >
                  <option value="">Select Category</option>
                  {DRINK_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder="Stock quantity"
                  className="search-input"
                  value={newDrink.stock}
                  onChange={(e) => setNewDrink(prev => ({ ...prev, stock: e.target.value }))}
                  required
                />
              </div>
              
              <div className="image-upload-container">
                <label htmlFor="add-image-upload" className="image-upload-label">
                  {newDrink.image ? 'Change Image' : 'Upload Image (Optional)'}
                </label>
                <input
                  id="add-image-upload"
                  type="file"
                  accept="image/*"
                  className="image-upload-input"
                  onChange={(e) => handleImageUpload(e, false)}
                />
                {newDrink.imagePreview && (
                  <img src={newDrink.imagePreview} alt="Preview" className="image-preview" />
                )}
              </div>

              <textarea
                placeholder="Description (optional)"
                className="search-input form-textarea"
                value={newDrink.description}
                onChange={(e) => setNewDrink(prev => ({ ...prev, description: e.target.value }))}
                rows="3"
              />
              <div className="form-actions">
                <button type="button" className="nav-button" onClick={() => {
                  clearForm();
                  setShowAddForm(false);
                }}>
                  Cancel
                </button>
                <button type="submit" className="notify-button">
                  Add Drink
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Form */}
        {editingDrink && (
          <div className="orders-controls" ref={editFormRef}>
            <h3 className="form-title">Edit Drink</h3>
            <form onSubmit={handleEditSubmit} className="add-drink-form">
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Drink name"
                  className="search-input"
                  value={editingDrink.name}
                  onChange={(e) => setEditingDrink(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  className="search-input"
                  value={editingDrink.price}
                  onChange={(e) => setEditingDrink(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
                <select
                  className="search-input"
                  value={editingDrink.category}
                  onChange={(e) => setEditingDrink(prev => ({ ...prev, category: e.target.value }))}
                  required
                >
                  <option value="">Select Category</option>
                  {DRINK_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder="Stock quantity"
                  className="search-input"
                  value={editingDrink.stock}
                  onChange={(e) => setEditingDrink(prev => ({ ...prev, stock: e.target.value }))}
                  required
                />
              </div>
              
              <div className="image-upload-container">
                <label htmlFor="edit-image-upload" className="image-upload-label">
                  {editingDrink.image ? 'Change Image' : 'Upload Image (Optional)'}
                </label>
                <input
                  id="edit-image-upload"
                  type="file"
                  accept="image/*"
                  className="image-upload-input"
                  onChange={(e) => handleImageUpload(e, true)}
                />
                {editingDrink.imagePreview ? (
                  <div className="image-edit-container">
                    <img src={editingDrink.imagePreview} alt="Preview" className="image-preview" />
                    <button
                      type="button"
                      className="nav-button"
                      onClick={() => {
                        if (editingDrink.imagePreview) {
                          URL.revokeObjectURL(editingDrink.imagePreview);
                        }
                        setEditingDrink(prev => ({ 
                          ...prev, 
                          image: null, 
                          imagePreview: null
                        }));
                      }}
                    >
                      Remove Image
                    </button>
                  </div>
                ) : editingDrink.image && typeof editingDrink.image === 'string' && (
                  <div className="image-edit-container">
                    <img src={editingDrink.image} alt="Current" className="image-preview" />
                    <button
                      type="button"
                      className="nav-button"
                      onClick={() => setEditingDrink(prev => ({ ...prev, image: null }))}
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>

              <textarea
                placeholder="Description (optional)"
                className="search-input form-textarea"
                value={editingDrink.description}
                onChange={(e) => setEditingDrink(prev => ({ ...prev, description: e.target.value }))}
                rows="3"
              />
              <div className="form-actions">
                <button type="button" className="nav-button" onClick={() => setEditingDrink(null)}>
                  Cancel
                </button>
                <button type="submit" className="notify-button">
                  Update Drink
                </button>
              </div>
            </form>
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
      </div>
    </div>
  );
};

export default InventoryPage;