import React, { useContext, useRef, useState } from 'react'
import './Login.css'
import { useNavigate } from 'react-router-dom';
import ThemeButton from '../components/ThemeButton';
import { LightDark, SignUpModal } from '../contexts/contexts';
import { useAuth } from '../contexts/AuthContext';
import SignUp from '../components/SignUp';

const Login = () => {
  const username = useRef(null);
  const password = useRef(null);
  const navigate = useNavigate();
  const { theme, setTheme } = useContext(LightDark);
  const { signupmodal, setSignUpModal } = useContext(SignUpModal);

  // Use the new auth context
  const { login, isLoading } = useAuth();

  const checklogin = async (e) => {
    e.preventDefault();

    try {
      const typedUsername = username.current ? username.current.value : '';
      const typedPassword = password.current ? password.current.value : '';

      // Enforce exact case matching
      if (typedUsername !== typedUsername.trim() || typedPassword !== typedPassword.trim()) {
        alert('Username and password are case-sensitive. Remove leading/trailing spaces.');
        return;
      }

      const result = await login({
        username: typedUsername,
        password: typedPassword
      });

      if (result.success) {
        navigate('/products');
      } else {
        alert(result.error || 'Login failed');
        window.location.reload();
      }

    } catch (error) {
      alert('Incorrect credentials/ the user does not exist (please sign up!)');
      window.location.reload();
    }
  };

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
            <button type='submit' className='login' disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>
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