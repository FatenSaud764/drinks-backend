import React, { useContext, useRef, useState } from 'react'
import './Login.css'
import {useNavigate} from 'react-router-dom';
import ThemeButton from '../components/ThemeButton';
import { AccessTokens, LightDark, LoggedIn, Orders, RefreshTokens, SignUpModal } from '../contexts/contexts';
import SignUp from '../components/SignUp';
import AxiosInstance from '../components/Axios';

const Login = () => {
  const username = useRef(null);
  const password = useRef(null);
  const navigate = useNavigate();
  const {theme, setTheme} = useContext(LightDark);
  const {loggedin, setLoggedIn} = useContext(LoggedIn);
  const {signupmodal, setSignUpModal} = useContext(SignUpModal);
  const {orders, setOrders} = useContext(Orders)
  const {accessToken, setAccessToken} = useContext(AccessTokens);
  const {refreshToken, setRefreshToken} = useContext(RefreshTokens);


  /** 
  const checklogin = () => {
    if(username.current.value==='Samus' && password.current.value==='123') {
      navigate('/products');
      setLoggedIn(true);
    }
    else{
      alert('Incorrect credentials, plese try again or sign up!')
    }
  }*/

  const checklogin = async (e) => {
    try{
    const request = await AxiosInstance.post('api/auth/token/', {username: username.current?username.current.value.trim():'', password: password.current?password.current.value.trim():''});
    const {access, refresh} = await request.data;
    setAccessToken(access);
    setRefreshToken(refresh);
    console.log('access', accessToken);
    console.log('refresh', refreshToken)
    console.log('This is working!!!');
    if(accessToken && refreshToken && accessToken != 'null' && refreshToken != 'null') {
      navigate('/products');
    }
    e.preventDefault();
  }
  catch(error) {
      alert('Incorrect credentials/ the user does not exist (please sign up!)');
      window.location.reload();
  }
  }



  return (
    <>
    <div className='wrapper' id={theme}>
      <div className='togglebutton'><ThemeButton/></div>
      <div className='content'>
      <form onSubmit={(e) => {checklogin(e); e.preventDefault();}}>
        <h1>SwiftServe</h1>
        <h4>Skip the queue!</h4>
        <input type='text' placeholder='Username' required className='username' ref={username}/>
        <input type='password' placeholder='Password' className='password' ref={password} required/>
        <button type='submit' className='login'>Log in</button>
      </form>
      <h5>Don't have an account?</h5>
      <button className='signup' onClick={() => {setSignUpModal(true)}}>Sign up</button>
      {signupmodal && <SignUp />}
      </div>
    </div>
    </>
  )
}

export default Login
