import React, { useContext, useRef } from 'react'
import './Home.css'
import {useNavigate} from 'react-router-dom';
import ThemeButton from '../components/ThemeButton';
import { LightDark, Orders } from '../contexts/contexts';

const Home = () => {
  const username = useRef(null);
  const password = useRef(null);
  const navigate = useNavigate();
  const {theme, setTheme} = useContext(LightDark);

  const {orders, setOrders} = useContext(Orders)

  const checklogin = () => {
    if(username.current.value==='Samus' && password.current.value==='123') {
      navigate('/products');
    }
    else{
      alert('Incorrect credentials, plese try again or sign up!')
    }
  }



  return (
    <>
    <div className='wrapper' id={theme}>
      <div className='togglebutton'><ThemeButton/></div>
      <form onSubmit={checklogin}>
      <div className='content'>
        <h1>SwiftServe</h1>
        <h4>Skip the queue!</h4>
        <input type='text' placeholder='Username' required className='username' ref={username}/>
        <input type='text' placeholder='Password' className='password' ref={password} required/>
        <button type='submit' className='login'>Log in</button>
        <h5>Don't have an account?</h5>
        <button className='signup'>Sign up</button>
      </div>
      </form>
    </div>
    </>
  )
}

export default Home
