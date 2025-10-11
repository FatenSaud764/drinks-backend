import React, { useState, useContext } from 'react'
import { LightDark, SelectedProduct, CartModalBoolean } from '../contexts/contexts'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/NavBar';
import './DrinkInfo.css'
import AddItems from '../components/AddItems';
import AxiosInstance from '../components/Axios.jsx';
import CartModal from '../components/CartModal.jsx';
import { FaArrowLeft } from "react-icons/fa";

const DrinkInfo = () => {
  const { selecteddrink, setSelectedDrink } = useContext(SelectedProduct);
  const { theme, setTheme } = useContext(LightDark);
  const [num, setNum] = useState(0);
  const [cartModal, setCartModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);

  // Use the new auth context
  const { accessToken, isLoggedIn } = useAuth();

  const addToCart = async (e, num) => {
    if(!isLoggedIn || !accessToken) return;
    if (num>0) {
      setCartModal(true);
      const request = async () => {
        await AxiosInstance.post(
          '/api/cart/items/',
          {"drink_id": e, "quantity": num},
          {headers:{Authorization: `Bearer ${accessToken}`}})
      }
      await request();
    } else {
      alert('Please select at least one drink to add to cart!');
    }
  }


  return (
    <div className='drinkinfowrapper' id={theme}>
        <CartModalBoolean.Provider value={{cartModal, setCartModal}}>
        <NavBar />
          {cartModal && <CartModal />}
        </CartModalBoolean.Provider>
        <div className='return'>
          <FaArrowLeft className='return_button'/>
          <div>Return to products page</div>
        </div>
        <img src= {`${selecteddrink.image}`} className='drinkimage' />
        <div className='drink_name_price'>
          <div className='drinkname'>
            {selecteddrink.name}
          </div>  
          <div className='drinkprice'>
            R{selecteddrink.price}
          </div>
        </div>
        <div className='drinkdesc'>
          {selecteddrink.description}
        </div>
        <div className='space'></div>
        <AddItems prod={selecteddrink} num={num} setNum={setNum} />
        <button className='addtocart' onClick={() => {addToCart(selecteddrink.id, num)}}>Add to cart</button>
        <br />
    </div>
  )
}

export default DrinkInfo