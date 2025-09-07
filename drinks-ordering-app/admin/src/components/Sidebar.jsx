import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import '../styles/Sidebar.css';
import LoginModal from './LoginModal';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

// Icons
import GlassIcon from '@mui/icons-material/LocalBarOutlined';
import HistoryIcon from '@mui/icons-material/HistoryToggleOffOutlined';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import LoginIcon from '@mui/icons-material/LoginOutlined';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';

const Sidebar = ({ isOpen, isMobile, onClose }) => {
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, isAuthenticated, login, logout, loading } = useAuth();

  const navigationItems = [
    { to: '/orders', icon: <GlassIcon/>, label: 'Orders' },
    { to: '/history', icon: <HistoryIcon/>, label: 'History' },
    { to: '/inventory', icon: <InventoryIcon/>, label: 'Inventory' },
  ];

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
    if (isMobile) {
      onClose();
    }
  };

  const handleLogin = async (loginData) => {
    try {
      await login(loginData);
      setShowLoginModal(false);
      toast.success('Logged in as admin');
      if (isMobile) {
        onClose();
      }
    } catch (error) {
      toast.error('Login failed: ' + (error?.response?.data?.detail || 'Invalid credentials'));
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    if (isMobile) {
      onClose();
    }
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <ul className="nav-list">
              {navigationItems.map((item, index) => (
                <li key={index} className="nav-item">
                  <Link 
                    to={item.to} 
                    className={`nav-link ${isActiveRoute(item.to) ? 'active' : ''}`}
                    onClick={() => isMobile && onClose()}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sidebar-footer">
            {isAuthenticated ? (
              <div className="auth-section">
                {/* User info */}
                <div className="user-info">
                  <div className="user-avatar">
                    <PersonIcon />
                  </div>
                  <div className="user-details">
                    <span className="user-name">
                      {user?.first_name && user?.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : user?.username || user?.email}
                    </span>
                    <span className="user-role">
                      {user?.is_admin ? 'Admin' : 'Staff'}
                    </span>
                  </div>
                </div>
                
                {/* Logout button */}
                <button
                  className="logout-button"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <span className="nav-icon">
                    <LogoutIcon />
                  </span>
                  <span className="nav-label">Logout</span>
                </button>
              </div>
            ) : (
              <button 
                className="login-button"
                onClick={handleLoginClick}
                title="Admin Login"
                disabled={loading}
              >
                <span className="nav-icon">
                  <LoginIcon />
                </span>
                <span className="nav-label">
                  {loading ? 'Loading...' : 'Admin Login'}
                </span>
              </button>
            )}
          </div>
        </div>
      </aside>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </>
  );
};

export default Sidebar;