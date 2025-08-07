import '../styles/Sidebar.css';
import GlassIcon from '@mui/icons-material/LocalBarOutlined';
import HistoryIcon from '@mui/icons-material/HistoryToggleOffOutlined';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';

const Sidebar = ({ isOpen, isMobile, onClose }) => {
  const navigationItems = [
    { href: 'orders', icon: <GlassIcon/>, label: 'Orders' },
    { href: 'history', icon: <HistoryIcon/>, label: 'History' },
    { href: 'inventory', icon: <InventoryIcon/>, label: 'Inventory' },
    { href: 'settings', icon: <SettingsIcon/>, label: 'Settings' }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
      <div className="sidebar-content">
        
        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navigationItems.map((item, index) => (
              <li key={index} className="nav-item">
                <a 
                  href={item.href} 
                  className="nav-link"
                  onClick={() => isMobile && onClose()}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;