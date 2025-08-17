import { Link, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';
// Icons
import GlassIcon from '@mui/icons-material/LocalBarOutlined';
import HistoryIcon from '@mui/icons-material/HistoryToggleOffOutlined';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';

const Sidebar = ({ isOpen, isMobile, onClose }) => {
  const location = useLocation();

  const navigationItems = [
    { to: '/orders', icon: <GlassIcon/>, label: 'Orders' },
    { to: '/history', icon: <HistoryIcon/>, label: 'History' },
    { to: '/inventory', icon: <InventoryIcon/>, label: 'Inventory' },
  ];

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
      <div className="sidebar-content">
        
        {/* Navigation */}
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
      </div>
    </aside>
  );
};

export default Sidebar;