import ThemeToggle from 'shared/components/ThemeToggle';
import '../styles/Header.css';

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  return (
    <header className="header">
      <button 
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <span className={`hamburger ${isSidebarOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
        <span className="toggle-text">Menu</span>
      </button>
      
      <h1 className="header-title">Admin</h1>
      
      <div className="header-actions">
        <ThemeToggle/>
      </div>
    </header>
  );
};

export default Header;