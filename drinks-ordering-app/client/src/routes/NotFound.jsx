import React from 'react'
import './NotFound.css'
import { useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className='errorwrapper'>
      <h1 className='error404'>
        Oops... Error 404
      </h1>
      <h5 className='pagedoesnotexist'>The
        page you are looking for does not exist!</h5>
      <button className='returnbutton' onClick={() => { navigate('/home') }}>Return Home</button>
    </div>
  )
}

export default NotFound
