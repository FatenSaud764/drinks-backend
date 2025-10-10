import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import './Notification.css';
import { useEffect, useRef } from 'react';

export default function Notification({ isDisplaying, onClose, orderStatus, orderNumber }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (isDisplaying) {
      timerRef.current = setTimeout(() => {
        onClose();
      }, 8000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isDisplaying]);

  const formatStatus = (status) => {
    if (!status) return '';

    const statusMap = {
      'pending': 'Pending',
      'preparing': 'Being Prepared',
      'ready': 'Ready for Pickup',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };

    return statusMap[status.toLowerCase()] || status;
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
        >
          <div>
            {orderNumber && <strong>Order #{orderNumber}: </strong>}
            Your order is now <strong>{formatStatus(orderStatus)}</strong>
          </div>
          <button className="close-notif-btn" onClick={onClose} aria-label="Close notification">
            <X size={24} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
