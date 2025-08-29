import React, { useContext, useRef, useEffect } from 'react'
import { LightDark } from '../contexts/contexts'
import './NavBar.css'
import ThemeButton from './ThemeButton'
import { TiShoppingCart } from "react-icons/ti";
import { AiOutlineMenu } from "react-icons/ai";
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx'

export default function NavBar() {
  const {theme, setTheme} = useContext(LightDark);
  const navigate = useNavigate();
  const menuRef = useRef(null)
  const navRef = useRef(null)
  const { user, login, logout } = useAuth()

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

  return (
    <header ref={navRef} className="nav glass">
      <div className="nav-left">
        {/* Mobile menu */}
        <details className="hamburger" ref={menuRef} role="navigation">
          <summary aria-label="Menu" aria-expanded={menuRef.current?.open ? 'true' : 'false'} aria-controls="hamburger-sidebar" role="button">
            <span className={`summary-hamburger ${menuRef.current?.open ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </summary>
          <div className="sidebar-backdrop" onClick={closeMenu} />
          <aside id="hamburger-sidebar" className="sidebar opaque" aria-label="Mobile menu">
            <div className="menu-pane">
              <h2 className="menu-title">Menu</h2>
              <nav className="menu-buttons">
                <NavLink to="/" className="menu-btn" onClick={closeMenu}>Home</NavLink>
                <NavLink to="/products" className="menu-btn" onClick={closeMenu}>Products</NavLink>
                {user && <NavLink to="/cart" className="menu-btn" onClick={closeMenu}>Cart</NavLink>}
                {user && <NavLink to="/orders" className="menu-btn" onClick={closeMenu}>Previous Orders</NavLink>}
              </nav>
            </div>
          </aside>
        </details>
      </div>
      <div className='nav' id={theme}>
          <div className='navbuttons'>
            <div className='themeprod'><ThemeButton /></div>
            <button className='cart' onClick={() => {navigate('/Cart')}}><TiShoppingCart className='carticon'/></button>
          </div>
      </div>
    </header>
  )
}
