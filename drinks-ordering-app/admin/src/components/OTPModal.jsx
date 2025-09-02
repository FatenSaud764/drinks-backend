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
  IconButton
} from '@mui/material';
import { Close as CloseIcon, Lock as LockIcon, Search as SearchIcon } from '@mui/icons-material';
import { useOrderOTP } from '../hooks/useOrders';
import { useInventory } from '../hooks/useInventory';
import { normaliseOrder } from '../utils/normaliseOrder';

const OTPModal = ({ 
  open, 
  onClose, 
  onConfirm, 
  order = null,
  mode = 'complete',
  title,
  message,
  availableOrders = []
}) => {
  const [pin, setPin] = useState('');
  const [foundOrder, setFoundOrder] = useState(null);
  const [localError, setLocalError] = useState('');

  // Use the OTP verification hook
  const { 
    loading: otpLoading, 
    error: otpError, 
    verifyOTP, 
    clearError: clearOtpError, 
    resetVerification 
  } = useOrderOTP();

  // Use the inventory hook to get drink data
  const { drinks } = useInventory();

  // Helper function to get drink details by ID
  const getDrinkById = (drinkId) => {
    return drinks.find(drink => drink.id === drinkId);
  };

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setPin('');
      setFoundOrder(null);
      setLocalError('');
      resetVerification();
      clearOtpError();
    }
  }, [open]);

  const getTitle = () => {
    if (title) return title;
    return mode === 'find' ? 'Complete Order by PIN' : 'PIN Authentication Required';
  };

  const getMessage = () => {
    if (message) return message;
    return mode === 'find' 
      ? 'Enter your order PIN to find and complete your order:' 
      : 'Please enter your PIN to complete this order:';
  };

  const findOrderByPin = async (pinValue) => {
    if (!pinValue || !pinValue.trim()) return null;
    
    // Ensure PIN is always treated as a string
    const pinString = pinValue.trim().toString();
    
    // Try to verify PIN against each ready order
    for (const availableOrder of availableOrders) {
      try {
        const normalisedOrder = normaliseOrder(availableOrder);
        await verifyOTP(normalisedOrder.id, pinString);
        return normalisedOrder;
      } catch (err) {
        // Continue to next order if PIN doesn't match this one
        continue;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearOtpError();

    if (!pin.trim()) {
      setLocalError('Please enter a PIN');
      return;
    }

    // Ensure PIN is always sent as a string
    const pinString = pin.trim().toString();

    try {
      if (mode === 'find') {
        const targetOrder = await findOrderByPin(pinString);
        
        if (!targetOrder) {
          setLocalError('No ready order found for this PIN. Please check and try again.');
          return;
        }

        // Set the found order to display its details
        setFoundOrder(targetOrder);
        onConfirm(true, targetOrder);
        handleClose();
      } else {
        if (!order) {
          setLocalError('No order specified for verification.');
          return;
        }

        const normalisedOrder = normaliseOrder(order);
        await verifyOTP(normalisedOrder.id, pinString);
        onConfirm(true, normalisedOrder);
        handleClose();
      }
    } catch (err) {
      if (mode === 'find') {
        setLocalError('Invalid PIN or no matching ready order found. Please try again.');
      } else {
        setLocalError('Invalid PIN. Please try again.');
      }
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleCancel = () => {
    onConfirm(false);
    handleClose();
  };

  const handlePinChange = (e) => {
    setPin(e.target.value);
    setLocalError('');
    clearOtpError();
    setFoundOrder(null); // Clear any previously found order when typing
  };

  const displayError = otpError || localError;

  // Display the order (either the passed order or the found order)
  const displayOrder = order ? normaliseOrder(order) : foundOrder;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          minHeight: 350
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
          disabled={otpLoading}
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

          {/* PIN Input */}
          <TextField
            autoFocus
            fullWidth
            label="Enter PIN"
            type="text"
            variant="outlined"
            value={pin}
            onChange={handlePinChange}
            disabled={otpLoading}
            inputProps={{
              maxLength: 10,
              style: { 
                fontSize: '1.2rem', 
                textAlign: 'center',
                letterSpacing: '0.2rem'
              }
            }}
            sx={{ mb: 2 }}
            placeholder="Enter PIN"
            helperText="Enter the PIN from your order receipt"
          />

          {/* Order Details - Show after order is found or if order is pre-selected */}
          {displayOrder && (
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
                <strong>Order:</strong> {displayOrder.orderNumber}
              </Typography>
              <Typography variant="body2">
                <strong>Total:</strong> R{displayOrder.totalAmount.toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Items:</strong>
              </Typography>
              <Box sx={{ ml: 2 }}>
                {displayOrder.items?.map((item, index) => {
                  const drink = getDrinkById(item.drink_id);
                  const itemName = drink?.name || 'Unknown Item';
                  
                  return (
                    <Typography key={index} variant="body2" color="text.secondary">
                      {item.quantity}x {itemName}
                    </Typography>
                  );
                }) || (
                  <Typography variant="body2" color="text.secondary">
                    No items listed
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {displayError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {displayError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCancel}
            disabled={otpLoading}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={otpLoading || !pin.trim()}
            color={mode === 'find' ? 'info' : 'warning'}
          >
            {otpLoading ? 'Verifying...' : mode === 'find' ? 'Find & Complete' : 'Confirm Completion'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default OTPModal;