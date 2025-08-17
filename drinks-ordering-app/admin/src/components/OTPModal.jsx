import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  IconButton,
  Autocomplete
} from '@mui/material'; // Using basic dialog components from MUI
import { Close as CloseIcon, Lock as LockIcon, Search as SearchIcon } from '@mui/icons-material';
import { validateCompletionPIN, validateOrderPIN } from '../services/OrderService';

const OTPModal = ({ 
  open, 
  onClose, 
  onConfirm, 
  order = null, // null when used for "find order by PIN" mode
  mode = 'complete', // 'complete' or 'find'
  title,
  message,
  availableOrders = [] // for autocomplete in find mode
}) => {
  const [pin, setPin] = useState('');
  const [orderQuery, setOrderQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dynamic titles and messages based on mode
  const getTitle = () => {
    if (title) return title;
    return mode === 'find' ? 'Complete Order - Find by PIN' : 'PIN Authentication Required';
  };

  const getMessage = () => {
    if (message) return message;
    return mode === 'find' 
      ? 'Enter PIN or search for order to complete:' 
      : 'Please enter your PIN to complete this order:';
  };

  // Clear form when modal opens/closes
  useEffect(() => {
    if (open) {
      setPin('');
      setOrderQuery('');
      setSelectedOrder(null);
      setError('');
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (mode === 'find') {
        // Find order by PIN mode
        let targetOrder = selectedOrder;
        
        // If no order selected from dropdown, try to find by PIN
        if (!targetOrder && pin.trim()) {
          targetOrder = findOrderByPin(pin);
        }
        
        if (!targetOrder) {
          setError('No order found for this PIN. Please check and try again.');
          setPin('');
          setLoading(false);
          return;
        }

        // Validate PIN for the found order - use order-specific validation
        const isValid = validateOrderPIN(pin, targetOrder.orderNumber) || validateCompletionPIN(pin);
        
        if (isValid) {
          onConfirm(true, targetOrder); // Pass the found order
          handleClose();
        } else {
          setError(`Invalid PIN for order ${targetOrder.orderNumber}. Please try again.`);
          setPin('');
        }
      } else {
        // Standard PIN validation mode for specific order
        const isValid = validateOrderPIN(pin, order?.orderNumber) || validateCompletionPIN(pin);
        
        if (isValid) {
          onConfirm(true, order);
          handleClose();
        } else {
          setError('Invalid PIN. Please try again.');
          setPin('');
        }
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Find order by PIN - matches PIN to last digit of order number
  const findOrderByPin = (pinValue) => {
    if (!pinValue || !pinValue.trim()) return null;
    
    // Look for order where the PIN matches the last digit of the order number
    // - Just for now until backend is up and runnin'
    const matchingOrder = availableOrders.find(order => {
      // Extract last digit from order number (e.g., "ORD-003" -> "3")
      const orderDigit = order.orderNumber.split('-')[1] || order.orderNumber.slice(-3);
      const lastDigit = orderDigit.slice(-1);
      
      return lastDigit === pinValue.trim();
    });
    
    return matchingOrder;
  };

  const handleClose = () => {
    setPin('');
    setOrderQuery('');
    setSelectedOrder(null);
    setError('');
    setLoading(false);
    onClose();
  };

  const handleCancel = () => {
    onConfirm(false);
    handleClose();
  };

  // Filter orders for autocomplete
  const getOrderOptions = () => {
    return availableOrders
      .filter(ord => ord.status === 'ready') // Only show ready orders
      .map(ord => ({
        label: `${ord.orderNumber} - R${ord.totalAmount.toFixed(2)}`,
        value: ord
      }));
  };

  // When an order is selected from dropdown, extract and set the PIN
  const handleOrderSelection = (event, newValue) => {
    const order = newValue?.value || null;
    setSelectedOrder(order);
    
    // Auto-fill PIN when order is selected
    if (order) {
      const orderDigit = order.orderNumber.split('-')[1] || order.orderNumber.slice(-3);
      const lastDigit = orderDigit.slice(-1);
      setPin(lastDigit);
    } else {
      setPin('');
    }
    
    setError(''); // Clear error when order is selected
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            minHeight: mode === 'find' ? 450 : 350
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1,
        bgcolor: mode === 'find' ? 'info.light' : 'warning.light',
        color: mode === 'find' ? 'info.contrastText' : 'warning.contrastText'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {mode === 'find' ? <SearchIcon /> : <LockIcon />}
          <Typography variant="h6" component="span">
            {getTitle()}
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose} 
          size="small"
          disabled={loading}
          sx={{ color: 'inherit' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {getMessage()}
          </Typography>
          
          {/* Order Search (Find Mode) */}
          {mode === 'find' && (
            <Box sx={{ mb: 3 }}>
              <Autocomplete
                options={getOrderOptions()}
                getOptionLabel={(option) => option.label}
                value={selectedOrder ? { label: `${selectedOrder.orderNumber} - R${selectedOrder.totalAmount.toFixed(2)}`, value: selectedOrder } : null}
                onChange={handleOrderSelection}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Orders"
                    placeholder="Type to search orders..."
                    variant="outlined"
                    disabled={loading}
                  />
                )}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Or enter PIN below to find the order automatically
              </Typography>
            </Box>
          )}

          {/* Order Details (Complete Mode or when order is selected) */}
          {(order || selectedOrder) && (
            <Box sx={{ 
              bgcolor: 'grey.50', 
              p: 2, 
              borderRadius: 1, 
              mb: 2,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                Order Details:
              </Typography>
              <Typography variant="body2">
                <strong>Order:</strong> {(order || selectedOrder)?.orderNumber}
              </Typography>
              <Typography variant="body2">
                <strong>Total:</strong> R{(order || selectedOrder)?.totalAmount.toFixed(2)}
              </Typography>
              <Typography variant="body2">
                <strong>Items:</strong> {(order || selectedOrder)?.items.map(item => 
                  `${item.quantity}x ${item.name}`
                ).join(', ')}
              </Typography>
            </Box>
          )}

          <TextField
            autoFocus={mode !== 'find'}
            fullWidth
            label="Enter PIN"
            type="password"
            variant="outlined"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              // Clear selected order if user manually types PIN
              if (mode === 'find' && e.target.value !== '' && selectedOrder) {
                const expectedPin = selectedOrder.orderNumber.split('-')[1]?.slice(-1) || selectedOrder.orderNumber.slice(-1);
                if (e.target.value !== expectedPin) {
                  setSelectedOrder(null);
                }
              }
            }}
            disabled={loading}
            slotProps={{
              input: {
                maxLength: 10,
                style: { 
                  fontSize: '1.2rem', 
                  textAlign: 'center',
                  letterSpacing: '0.2rem'
                }
              }
            }}
            sx={{ mb: 2 }}
            placeholder="Enter PIN"
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="caption" color="text.secondary">
            {mode === 'find' 
              ? 'Enter PIN "3" for ORD-003, PIN "5" for ORD-005, etc. Or use universal PIN "0"'
              : 'Use the order-specific PIN or universal PIN "0"'
            }
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCancel}
            disabled={loading}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={loading || !pin.trim()}
            color={mode === 'find' ? 'info' : 'warning'}
          >
            {loading ? 'Processing...' : mode === 'find' ? 'Find & Complete' : 'Confirm Completion'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default OTPModal;