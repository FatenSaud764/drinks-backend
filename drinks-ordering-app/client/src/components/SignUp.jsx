import React, { useContext, useRef, useState } from 'react'
import './SignUp.css'
import { LightDark, SignUpModal } from '../contexts/contexts'
import AxiosInstance from './Axios'
// Icons
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';

const SignUp = () => {

  const { theme, setTheme } = useContext(LightDark);
  const { signupmodal, setSignUpModal } = useContext(SignUpModal);
  const user = useRef(null);
  const mail = useRef(null);
  const pass = useRef(null);
  const confirmpass = useRef(null);

  return (
    <div className='signupwrapper' id={theme}>
      <button className='closesignup' onClick={() => { setSignUpModal(false); }}><CloseIcon /></button>
      <form className='signupform' onSubmit={(e) => {
        e.preventDefault();
        if (user.current && mail.current && pass.current && confirmpass.current) {
          if (pass.current.value === confirmpass.current.value) {
            const signup = async () => {
              try {
                await AxiosInstance.post('api/auth/register/', { "username": user.current.value.trim(), "email": mail.current.value.trim(), "role": "customer", "password": pass.current.value.trim() });
                alert("User created successfully!");
                setSignUpModal(false);
              }
              catch (error) {
                const errors = error.response?.data;
                let message = 'Failed to create user!';

                if (errors) {
                  message = Object.entries(errors)
                    .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
                    .join('\n');
                }

                alert(message);
                setSignUpModal(false);
              }
            }
            signup();
          }
          else { alert("Passwords do not match!") }
          e.preventDefault();
        }
      }}>
        <h2>Create an account</h2>

        <div className='inputrow'>
          <label htmlFor='username'>Username</label>
          <div className='signup-input-container'>
            <PersonIcon className='signup-input-icon' />
            <input type='text' name='username' className='usernamebox' ref={user} required></input>
          </div>
        </div>

        <div className='inputrow'>
          <label htmlFor='email'>Email</label>
          <div className='signup-input-container'>
            <EmailIcon className='signup-input-icon' />
            <input type='email' name='email' className='emailbox' ref={mail} required></input>
          </div>
        </div>

        <div className='inputrow'>
          <label htmlFor='password'>Password</label>
          <div className='signup-input-container'>
            <LockIcon className='signup-input-icon' />
            <input type='password' name='password' className='passwordbox' ref={pass} required></input>
          </div>
        </div>

        <div className='inputrow'>
          <label htmlFor='confirmpassword'>Confirm password</label>
          <div className='signup-input-container'>
            <LockIcon className='signup-input-icon' />
            <input type='password' name='password' className='passwordbox' ref={confirmpass} required></input>
          </div>
        </div>

        <input type='submit' value='Signup' className='signupsubmit'></input>
      </form>
    </div>
  )
}

export default SignUp