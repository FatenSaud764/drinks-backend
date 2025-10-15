import React, { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { LightDark } from '../contexts/contexts';
import './NavBar.css';
import ThemeButton from './ThemeButton';
import { TiShoppingCart } from "react-icons/ti";
import { useNavigate, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Notification from './Notification.jsx';
import { useNotifications } from '../contexts/NotificationContext.jsx';

export default function NavBar() {
  const {theme, setTheme} = useContext(LightDark);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const navRef = useRef(null);

  const { notifications, removeNotification } = useNotifications();
  const [displayedNotification, setDisplayedNotification] = useState(null);

  // Use only the new AuthContext
  const { user, accessToken, refreshToken, isLoggedIn, login, logout } = useAuth();

  useEffect(() => {
    if (notifications.length > 0 && !displayedNotification) {
      const latest = notifications[notifications.length - 1];
      setDisplayedNotification(latest);
    }
  }, [notifications, displayedNotification]);

  const handleCloseNotification = useCallback((e) => {
    if (displayedNotification) {
      if (e) {
        e.stopPropagation();
      }
      removeNotification(displayedNotification.id);
      setDisplayedNotification(null);
    }
  }, [removeNotification, displayedNotification]);

  const closeMenu = () => {
    if (menuRef.current) menuRef.current.removeAttribute('open')
  }

  useEffect(() => {
    const setNavOffset = () => {
      const h = navRef.current?.offsetHeight || 0
      document.documentElement.style.setProperty('--nav-offset', `${h}px`)
    }
    setNavOffset()
    const onResize = () => setNavOffset()
    window.addEventListener('resize', onResize)
    const details = menuRef.current
    if (details) details.addEventListener('toggle', setNavOffset)
    return () => {
      window.removeEventListener('resize', onResize)
      if (details) details.removeEventListener('toggle', setNavOffset)
    }
  }, [])

  const handleLogout = async () => {
    await logout();
  }

  const handleLogin = () => {
    navigate('/login');
  }

  return (
    <>
      <Notification 
        isDisplaying={!!displayedNotification}
        onClose={handleCloseNotification}
        orderStatus={displayedNotification?.newStatus}
        orderNumber={displayedNotification?.orderNumber}
      />
    <nav ref={navRef} className="nav" id={theme}>
      <div className="nav-left">
        <details className="hamburger" ref={menuRef} role="navigation">
          <summary aria-label="Menu" aria-expanded={menuRef.current?.open ? 'true' : 'false'} aria-controls="hamburger-sidebar" role="button">
            <span className={`summary-hamburger ${menuRef.current?.open ? 'open' : 'closed'}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </summary>
          <div className="sidebar-backdrop" onClick={closeMenu} />
          <aside id="hamburger-sidebar" className="sidebar opaque" aria-label="Mobile menu">
            <div className="menu-pane">
              <h2 className="menu-title" style={{fontFamily: 'Roboto Slab', fontSize: '20px'}}>Menu</h2>
              <nav className="menu-buttons">
                {isLoggedIn && <div className="menu-user-info">Welcome, {user?.username || 'User'}!</div>}
                <NavLink to="/home" className="menu-btn" onClick={closeMenu}>Home</NavLink>
                <NavLink to="/products" className="menu-btn" onClick={closeMenu}>Products</NavLink>
                {isLoggedIn && <NavLink to="/orders" className="menu-btn" onClick={closeMenu}>Orders</NavLink>}

                <div className="menu-divider"></div>
                {accessToken && refreshToken && accessToken !== 'null' && refreshToken !== 'null' ? (
                  <button className="menu-btn menu-logout" onClick={handleLogout}>Logout</button>
                ) : (
                  <button className="menu-btn menu-login" onClick={handleLogin}>Login</button>
                )}
              </nav>
            </div>
          </aside>
        </details>
        
        <Link to="/home" className="brand" aria-label="SwiftServe">
          <span className="brand-text">SwiftServe</span>
        </Link>
      </div>

      <nav className="nav-center" aria-label="Primary">
        <NavLink to="/home" className="menu-btn" onClick={closeMenu}>Home</NavLink>
        <NavLink to="/products">Products</NavLink>
        {user && <NavLink to="/orders" className="hide-sm">Previous Orders</NavLink>}
      </nav>

      <div className='nav-right'>
        <div className='navbuttons'>
          <div className='themeprod'>
            <ThemeButton />
          </div>
          <button className='cart' onClick={() => {navigate('/cart')}}>
            <TiShoppingCart className='carticon'/>
          </button>
          
          {user ? (
            <>
              <span className="logged-in-username hide-sm">Hi, {user.username}</span>
              <button className="user-btn hide-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="user-btn hide-sm" onClick={handleLogin}>Login</button>
          )}
        </div>
      </div>
    </nav>
    </>
  )
}
