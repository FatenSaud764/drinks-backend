import React, { useContext } from 'react'
import './Home.css'
import { DrinkCategory, LightDark } from '../contexts/contexts'
import NavBar from '../components/NavBar';
import { useAuth } from '../contexts/AuthContext';
import { getDrinkImage , DRINK_CATEGORIES, DRINK_CATEGORY_IMAGES} from '../../../packages/shared/types';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const {theme, setTheme} = useContext(LightDark);
  const {user} = useAuth();
  const {category, setCategory} = useContext(DrinkCategory);
  const navigate = useNavigate();

  return (
    <div className='homewrapper' id={theme}>
      <NavBar />
      <div className='greeting'>Welcome back, {user?.username}!</div>
      <div className='buttonslist'>
        {Object.values(DRINK_CATEGORIES).map((drink) => <button className='categorybutton' onClick={() => {setCategory(drink); navigate('/products')}}>
            <img src={getDrinkImage(drink)} className='drinkimg'/>
            {drink.charAt(0).toUpperCase() + drink.slice(1).toLowerCase()}
            </button>)}
        
      </div>
      <br />
      <br />
    </div>
  )
}

export default Home
