import React, { useContext } from 'react'
import './Home.css'
import { IoIosArrowDroprightCircle } from "react-icons/io";
import { DrinkCategory, LightDark, ProductList } from '../contexts/contexts'
import NavBar from '../components/NavBar';
import { useAuth } from '../contexts/AuthContext';
import { getDrinkImage , DRINK_CATEGORIES, DRINK_CATEGORY_IMAGES} from '../../../packages/shared/types';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Home = () => {
  const {theme, setTheme} = useContext(LightDark);
  const {user} = useAuth();
  const {category, setCategory} = useContext(DrinkCategory);
  const navigate = useNavigate();
  const {products, setProducts} = useContext(ProductList);

  console.log('drinks', products)

  const settings = {
    dots: false,
    swipeToSlide: true,
    infinite: true,
    autoplay:false,
    slidesToShow: 2,
    slidesToScroll: 1,
    arrows: false,
    centerMode: false
  };

  return (
    <div className='homewrapper' id={theme}>
      <NavBar />
      <div className='greeting'>Welcome back, {user?.username}!</div>
      <div className='buttonslist'>
        {Object.values(DRINK_CATEGORIES).map((drink) => <button key={drink} className='categorybutton' onClick={() => {setCategory(drink); navigate('/products')}}>
            <img src={getDrinkImage(drink)} className='drinkimg'/>
            {drink.charAt(0).toUpperCase() + drink.slice(1).toLowerCase()}
            </button>)}
      </div>
      <div className='carousel-list'>
        {Object.values(DRINK_CATEGORIES).map(category => 
        <div className='carousel-wrapper' key={category}>
        <div className='category-header'>
          <h4 className='category-name'>{category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}</h4>
          <button className='category-button' onClick={() => {setCategory(category); navigate('/products')}}><IoIosArrowDroprightCircle className='category-button'/></button>
        </div>
        <Slider {...settings} className='slide-container'>
          {products.filter(drink => drink.category==category).map(drink => <div className='carousel-drink'>
            <img className='carousel-image' src={`http://127.0.0.1:8000${drink.image}`} />
            <h5 className='drink-name'>{drink.name}</h5>
            </div>)}
        </Slider>
        </div>
          )}
      </div>
      <br />
      <br />
    </div>
  )
}

export default Home
