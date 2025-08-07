import { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import 'shared/styles/Global.css';
import 'shared/styles/Theme.css';
import { ThemeProvider } from 'shared/contexts/ThemeContext';

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

        <MainContent />
      </div>
    </div>
    </ThemeProvider>
  );
}

export default App;