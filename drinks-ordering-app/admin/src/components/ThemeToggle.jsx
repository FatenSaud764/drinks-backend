/**
 * @author Kirsten Sanders
 * @description This component handles the theme toggle for light/dark mode
 *
*/
import { useTheme } from '../contexts/ThemeContext';

// MUI Icons
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import IconButton from '@mui/material/IconButton';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <IconButton onClick={toggleTheme} aria-label="Toggle Theme" color="inherit">
      {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
};

export default ThemeToggle;