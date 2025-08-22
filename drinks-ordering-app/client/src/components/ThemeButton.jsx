import React, { useContext } from 'react'
import { LightDark } from '../contexts/contexts';
import './ThemeButton.css'

const ThemeButton = () => {
    const {theme, setTheme} = useContext(LightDark);
    const toggled = (theme==="dark");
  return (
    <div className='lightdark'>
          <button className={`toggle ${toggled?"toggled": ""}`} onClick={() => {setTheme(theme==="light"?"dark":"light")}}>
            <div className='thumb' />
          </button>
    </div>
  )
}

export default ThemeButton
