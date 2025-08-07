import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from 'shared/contexts/ThemeContext';


const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: '📊',
    path: '/dashboard'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: '📈',
    path: '/analytics'
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: '⚙️',
    path: '/settings'
  }
];

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  
  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
    </button>
  );
};

const Sidebar = ({ currentPath, onNavigate }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">BarSide</div>
        <ThemeToggle />
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-header">Main Navigation</div>
          {NAVIGATION_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
              onClick={() => onNavigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.title}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

const Header = ({ title }) => {
  return (
    <header className="header">
      <h1>{title}</h1>
    </header>
  );
};

const PageContent = ({ pathname }) => {
  const getContent = () => {
    switch (pathname) {
      case '/dashboard':
        return {
          title: 'Dashboard',
          content: (
            <>
              <h2>Welcome to your Dashboard!</h2>
              <p>This is a completely custom dashboard built with pure CSS and your Ocean Depths theme. No MUI interference, just your beautiful styling working exactly as intended.</p>
            </>
          )
        };
      case '/analytics':
        return {
          title: 'Analytics',
          content: (
            <>
              <h2>Analytics</h2>
              <p>Here you can view all your analytics data. Your Ocean Depths theme provides the perfect professional look for data visualization.</p>
            </>
          )
        };
      case '/settings':
        return {
          title: 'Settings',
          content: (
            <>
              <h2>Settings</h2>
              <p>Configure your application settings here. The theme toggle in the sidebar demonstrates how your theme system works perfectly.</p>
            </>
          )
        };
      default:
        return {
          title: 'Welcome to BarSide',
          content: (
            <>
              <h2>Welcome to BarSide</h2>
              <p>Select a page from the sidebar to get started.</p>
            </>
          )
        };
    }
  };

  const { title, content } = getContent();

  return (
    <>
      <Header title={title} />
      <main className="content">
        <div className="content-card">
          <div id="page-content">
            {content}
          </div>
        </div>
      </main>
    </>
  );
};

export default function CustomDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="dashboard">
      <Sidebar 
        currentPath={location.pathname}
        onNavigate={handleNavigate}
      />
      <div className="main-content">
        <PageContent pathname={location.pathname} />
      </div>
    </div>
  );
}