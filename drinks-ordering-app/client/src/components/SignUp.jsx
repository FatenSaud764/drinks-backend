import React, { useContext } from 'react'
import './SignUp.css'
import { LightDark, SignUpModal } from '../contexts/contexts'

const SignUp = () => {

  const {theme, setTheme} = useContext(LightDark);
  const {signupmodal, setSignUpModal} = useContext(SignUpModal);
    
  return (
    <div className='signupwrapper' id={theme}>
        <button className='closesignup' onClick={() => {setSignUpModal(false)}}>x</button>
        <form className='signupform' onSubmit={() => {setSignUpModal(false)}}>
           <h2>Sign Up</h2> 
           <div className='inputrow'>
            <label for='username'>Username</label>
            <input type='text' name='username' className='usernamebox' required></input>
           </div>
           <div className='inputrow'>
            <label for='email'>Email</label>
            <input type='email' name='email' className='emailbox' required></input>
           </div>
           <div className='inputrow'>
            <label for='password'>Password</label>
            <input type='password' name='password' className='passwordbox' required></input>
           </div>
           <input type='submit' value='Signup' className='signupsubmit'></input>
        </form>
    </div>
  )
}

export default SignUp
