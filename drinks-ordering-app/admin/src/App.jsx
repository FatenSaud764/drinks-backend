import { useState, useEffect } from 'react';
// Routes
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Protected Routes
import ProtectedRoute from './components/ProtectedRoute';
// Main dashboard components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
// Pages
import OrdersPage from './pages/OrdersPage';
import HistoryPage from './pages/HistoryPage';
import InventoryPage from './pages/InventoryPage';
import UserManagement from "./pages/UserManagement";
// Styles
import './styles/Global.css';
// Contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
// Toastify for Toast Alerts (client-side only)
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Authentication
import { setupAuthInterceptors } from './api/auth';
import { AuthProvider } from './contexts/AuthContext';

// Initialize auth interceptors when app starts
setupAuthInterceptors();

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
    <AuthProvider>
    <ThemeProvider>
      <SnackbarProvider> {/* Snackbar Notification Provider */}
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

              {/* Toast notifications for client-side */}
              <ToastContainer position="top-right" autoClose={5000} />

              <Routes>
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route
                  path="/user-management"
                  element={
                    <ProtectedRoute>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Catch all routes not found */}
                <Route path="*" element={<Navigate to="/orders" replace />} />
              </Routes>
            </div>
          </div>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
    </AuthProvider>
  );
}

export default App;