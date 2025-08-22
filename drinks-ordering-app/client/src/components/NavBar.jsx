import React, { useContext } from 'react'
import { LightDark } from '../contexts/contexts'
import './NavBar.css'
import ThemeButton from './ThemeButton'
import { TiShoppingCart } from "react-icons/ti";
import { AiOutlineMenu } from "react-icons/ai";
import { useNavigate } from 'react-router-dom';

const NavBar = () => {
    const {theme, setTheme} = useContext(LightDark);
    const navigate = useNavigate();

  return (
    <div className='nav' id={theme}>
        <div className='navbuttons'>
        <div className='themeprod'><ThemeButton /></div>
        <button className='cart' onClick={() => {navigate('/Cart')}}><TiShoppingCart className='carticon'/></button>
        <button className='menu'><AiOutlineMenu className='menuicon' /></button>
        </div>
    </div>
  )
}

export default NavBar
