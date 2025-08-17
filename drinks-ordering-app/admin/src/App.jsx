import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Main dashboard components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
// Pages
import OrdersPage from './pages/OrdersPage';
import HistoryPage from './pages/HistoryPage';
import InventoryPage from './pages/InventoryPage';
// Styles
import './styles/Global.css';
// Themes
import { ThemeProvider } from './contexts/ThemeContext';
// Toastify for Toast Alerts
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile and manage responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Auto-close sidebar on mobile initially
      if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle body scroll lock for mobile overlay
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.classList.add('sidebar-mobile-open');
    } else {
      document.body.classList.remove('sidebar-mobile-open');
    }

    return () => {
      document.body.classList.remove('sidebar-mobile-open');
    };
  }, [isMobile, isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <ThemeProvider>
      <Router>
        <div className="app">
          <Header 
            toggleSidebar={toggleSidebar} 
            isSidebarOpen={isSidebarOpen}
          />
          
          <div className={`app-layout ${isSidebarOpen && !isMobile ? 'with-sidebar' : ''}`}>
            <Sidebar 
              isOpen={isSidebarOpen}
              isMobile={isMobile}
              onClose={closeSidebar}
            />

            {/* Mobile Overlay */}
            {isMobile && isSidebarOpen && (
              <div 
                className="sidebar-overlay active"
                onClick={closeSidebar}
              />
            )}

            { /* Toast notifications */ }
            <ToastContainer position="top-right" autoClose={5000} />

            <Routes>
              <Route path="/" element={<OrdersPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;