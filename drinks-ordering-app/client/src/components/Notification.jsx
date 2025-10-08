import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import './Notification.css';

export default function Notification({ isDisplaying, onClose }) {
  return (
    <AnimatePresence>
      {isDisplaying && (
        <motion.div
          initial={{ y: "-300%" }}
          animate={{ y: 0 }}
          exit={{ y: "-300%" }}
          transition={{ type: "tween", duration: 0.3 }}
          className="notification-motion-div"
        >
          <div>
            BRUH BRUH BRUH BRUH
          </div>
          <button className="close-notif-btn" onClick={onClose} >
            <X size={24} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
