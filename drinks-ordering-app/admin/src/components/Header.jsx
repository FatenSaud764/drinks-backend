/**
 * @author Kirsten Sanders
 * @description This component renders the header for the admin dashboard: themetoggle, sidebar toggle, and title.
*/

import ThemeToggle from './ThemeToggle';
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
      
      <h1 className="header-title">SwiftServe Staff</h1>
      
      <div className="header-actions">
        <ThemeToggle/>
      </div>
    </header>
  );
};

export default Header;