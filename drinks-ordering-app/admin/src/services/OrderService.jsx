import { toast } from 'react-toastify';
import { ORDER_STATUSES, notifyClient } from '../utils/OrderUtils';

// OTP Validation Function - will change when backend is implemented
export const validateCompletionPIN = (pin) => {  
  if (!pin || pin.trim() === '') {
    return false;
  }
  
  // For now, accept these PINs:
  // - "0" as a general demo PIN
  // - Last digit of order number (e.g., "3" for ORD-003, "5" for ORD-005)
  const validPins = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  return validPins.includes(pin.trim());
};

// Alternative function for more specific PIN validation per order
export const validateOrderPIN = (pin, orderNumber) => {
  if (!orderNumber) return false; // safety check

  const orderStr = String(orderNumber);   // ensure it's a string
  // Extract last digit from order number for demo
  const orderDigit = orderStr.slice(-1);

  // Accept either the order-specific PIN or the general demo PIN "0"
  return pin === orderDigit || pin === '0';
};