/**
 * @author Kirsten Sanders
 * @description This component provides a modal dialog for OTP (One-Time Password) verification.
*/

import { useState, useEffect } from 'react';
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
import '../styles/OTPModal.css';

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
    
    const pinString = pinValue.trim().toString();
    
    for (const availableOrder of availableOrders) {
      try {
        const normalisedOrder = normaliseOrder(availableOrder);
        await verifyOTP(normalisedOrder.id, pinString);
        return normalisedOrder;
      } catch (err) {
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

    const pinString = pin.trim().toString();

    try {
      if (mode === 'find') {
        const targetOrder = await findOrderByPin(pinString);
        
        if (!targetOrder) {
          setLocalError('No ready order found for this PIN. Please check and try again.');
          return;
        }

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
    setFoundOrder(null);
  };

  const displayError = otpError || localError;
  const displayOrder = order ? normaliseOrder(order) : foundOrder;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      className="otp-modal"
    >
      <DialogTitle className={`otp-modal-title ${mode === 'find' ? 'find-mode' : 'complete-mode'}`}>
        <div className="otp-modal-title-content">
          {mode === 'find' ? <SearchIcon /> : <LockIcon />}
          <Typography variant="h6" component="span">
            {getTitle()}
          </Typography>
        </div>
        <IconButton 
          onClick={handleClose} 
          size="small"
          disabled={otpLoading}
          className="otp-modal-close-button"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent className="otp-modal-content">
          <Typography variant="body1" className="otp-modal-message">
            {getMessage()}
          </Typography>

          <TextField
            autoFocus
            fullWidth
            label="Enter PIN"
            type="text"
            variant="outlined"
            value={pin}
            onChange={handlePinChange}
            disabled={otpLoading}
            className="otp-modal-pin-input"
            placeholder="Enter PIN"
            helperText="Enter the PIN from your order receipt"
          />

          {displayOrder && (
            <div className="otp-modal-order-details">
              <Typography variant="subtitle2" className="otp-modal-order-title">
                Order Details:
              </Typography>
              <Typography variant="body2" className="otp-modal-order-item">
                <strong>Order:</strong> {displayOrder.orderNumber}
              </Typography>
              <Typography variant="body2" className="otp-modal-order-item">
                <strong>Total:</strong> R{displayOrder.totalAmount.toFixed(2)}
              </Typography>
              <Typography variant="body2" className="otp-modal-order-item">
                <strong>Items:</strong>
              </Typography>
              <div className="otp-modal-items-list">
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
              </div>
            </div>
          )}

          {displayError && (
            <Alert severity="error" className="otp-modal-error">
              {displayError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions className="otp-modal-actions">
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
            className="otp-modal-submit-button"
          >
            {otpLoading ? 'Verifying...' : mode === 'find' ? 'Find & Complete' : 'Confirm Completion'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default OTPModal;