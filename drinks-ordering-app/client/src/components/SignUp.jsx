import React, { useContext, useRef } from 'react'
import './SignUp.css'
import { LightDark, SignUpModal } from '../contexts/contexts'
import AxiosInstance from './Axios'
import CloseIcon from '@mui/icons-material/Close';

const SignUp = () => {

  const { theme } = useContext(LightDark);
  const { setSignUpModal } = useContext(SignUpModal);
  const user = useRef(null);
  const mail = useRef(null);
  const pass = useRef(null);
  const confirmpass = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user.current && mail.current && pass.current && confirmpass.current) {
      const usernameValue = user.current.value;
      const emailValue = mail.current.value;
      const passwordValue = pass.current.value;
      const confirmPasswordValue = confirmpass.current.value;

      if (passwordValue !== confirmPasswordValue) {
        alert("Passwords do not match!");
        return;
      }

      try {
        await AxiosInstance.post('api/auth/register/', {
          username: usernameValue,  // case-sensitive
          email: emailValue.trim(),  // trim only for email
          role: "customer",
          password: passwordValue    // case-sensitive
        });
        alert("User created successfully!");
        setSignUpModal(false);
      } catch (error) {
        console.error(error);
        alert("Failed to create user, please try again!");
      }
    }
  };

  return (
    <div className='signupwrapper' id={theme}>
      <button className='closesignup' onClick={() => setSignUpModal(false)}><CloseIcon /></button>
      <form className='signupform' onSubmit={handleSubmit}>
        <h2>Create an account</h2> 
        <div className='inputrow'>
          <label htmlFor='username'>Username</label>
          <input type='text' name='username' className='usernamebox' ref={user} required />
        </div>
        <div className='inputrow'>
          <label htmlFor='email'>Email</label>
          <input type='email' name='email' className='emailbox' ref={mail} required />
        </div>
        <div className='inputrow'>
          <label htmlFor='password'>Password</label>
          <input type='password' name='password' className='passwordbox' ref={pass} required />
        </div>
        <div className='inputrow'>
          <label htmlFor='confirmpassword'>Confirm password</label>
          <input type='password' name='confirmpassword' className='passwordbox' ref={confirmpass} required />
        </div>
        <input type='submit' value='Signup' className='signupsubmit' />
      </form>
    </div>
  )
}

export default SignUp
