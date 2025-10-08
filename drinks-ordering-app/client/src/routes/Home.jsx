import React, { useContext, useEffect } from 'react'
import './Home.css'
import { IoIosArrowDroprightCircle } from "react-icons/io";
import { DrinkCategory, LightDark, Orders, ProductList } from '../contexts/contexts'
import NavBar from '../components/NavBar';
import { useAuth } from '../contexts/AuthContext';
import {DRINK_CATEGORIES} from '../../../packages/shared/types';
import AxiosInstance from '../components/Axios';
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
  const {orders, setOrders} = useContext(Orders);
  const {isLoggedIn, accessToken} = useAuth();

  const GetOrderData = async () => {
    if(!isLoggedIn || !accessToken) {
      setOrders([]);
      return;
    }
    // Abort previous request if still running
    try {
      const res = await AxiosInstance.get('api/orders/');
      setOrders(res.data);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        console.error('Error fetching orders:', err);
      }
    }
  };

  useEffect(() => {
    GetOrderData(); // Always fetch products
    const interval = setInterval(() => {
      GetOrderData();
    }, 5000)
    return () => clearInterval(interval);
  }, [])

  console.log('drinks', products)

  const settings = {
    dots: true,
    swipeToSlide: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed:2000,
    slidesToShow: 2,
    slidesToScroll: 1,
    arrows: false,
    draggable: true,
    touchMove: true,
    pauseOnDotsHover:false,
    pauseOnHover: true,
    centerMode: true,  // ← Change this to true
    centerPadding: '0px',  // ← Add this for spacing
  };

  const sortedOrders = orders.filter(order => order.status!="completed").sort((a, b) => {
        const dateA = new Date(a.created_at || a.date)
        const dateB = new Date(b.created_at || b.date)
        return dateB - dateA
      })

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#f59e0b'
      case 'completed':
        return '#10b981'
      case 'cancelled':
        return '#ef4444'
      case 'preparing':
        return '#3b82f6'
      case 'ready':
        return '#28a745'
      default:
        return '#F59E0B'
    }
  }
  const statusColor = sortedOrders.length>0 ? getStatusColor(sortedOrders[0].status) : getStatusColor('preparing');



  return (
    <div className='homewrapper' id={theme}>
      <NavBar />
      <div className='greeting'>Welcome back {user?user.username:''}!</div>
      <div className='orderwrapper' role='button' tabIndex={0} onClick={() => {navigate('/orders')}}>
        <div className='orderrow'>
          <div style={{fontFamily:'Nunito', fontSize:'20px', fontWeight: '800'}}>Your latest order:</div>
        </div>
        {sortedOrders.length<=0 ? <h3 style={{fontFamily: 'Nunito'}}>You have no active orders!</h3> : <div className='orderrow'>
          <div style={{fontFamily: 'Nunito', fontSize: '17px', fontWeight:'700'}}>Order #{sortedOrders[0].id}</div>
          <div style={{fontFamily: 'Nunito', fontSize: '17px', border: 'none', borderRadius: '2vh', background: `${statusColor}`, width: '11vh', height: '3vh', display:'flex', justifyContent:'center', justifyItems:'center', color:'white', alignContent: 'center', alignItems: 'center'}}>{sortedOrders[0].status}</div>
          </div>}
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
            <img className='carousel-image' src={`${drink.image}`} loading='lazy' />
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
