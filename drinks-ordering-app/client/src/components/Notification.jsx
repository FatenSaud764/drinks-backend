import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import './Notification.css';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Notification({ isDisplaying, onClose, orderStatus, orderNumber }) {
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (isDisplaying) {
      timerRef.current = setInterval(() => {
        onClose();
      }, 2500);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isDisplaying, onClose]);

  const handleClick = () => {
    onClose();
    navigate('/orders');
  };

  const formatStatusMessage = (status) => {
    if (!status) return '';

    const statusMap = {
      'pending': 'Pending',
      'preparing': 'Your order is now being prepared',
      'ready': 'You order is ready for pickup at the bar',
      'completed': 'Your order has been completed',
      'cancelled': 'Your order has been cancelled'
    };

    return statusMap[status?.toLowerCase()] || status;
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      'pending': 'status-pending',
      'preparing': 'status-preparing',
      'ready': 'status-ready',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };

    return statusClasses[status?.toLowerCase()] || '';
  };
  return (
    <AnimatePresence>
      {isDisplaying && (
        <motion.div
          initial={{ y: "-300%" }}
          animate={{ y: 0 }}
          exit={{ y: "-300%" }}
          transition={{ type: "tween", duration: 0.3 }}
          className={`notification-motion-div ${getStatusClass(orderStatus)}`}
          onClick={handleClick}
        >
          <div className="notification-text">
            {orderNumber && <strong>Order #{orderNumber}: </strong>}
            <strong>{formatStatusMessage(orderStatus)}</strong>
          </div>
          <button className="close-notif-btn" onClick={onClose} aria-label="Close notification">
            <X size={24} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
