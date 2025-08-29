import React, { useContext, useEffect } from 'react'
import './CartModal.css'
import { CartModalBoolean } from '../routes/Products'
import { SiTicktick } from "react-icons/si";

const CartModal = () => {
  const {cartModal, setCartModal} = useContext(CartModalBoolean);

  
  useEffect(() => {
      let timerId;
      if (cartModal) {
        timerId = setInterval(() => {
          setCartModal(false);
        }, 1000); 
      }
      return () => {
        clearInterval(timerId);
      };
    }, [setCartModal(true)]);

  return (
    <div className='cartmodalwrapper'>
        <SiTicktick />
      <div className='addednotif'>Successfully added drink to cart!</div>
    </div>
  )
}

export default CartModal
