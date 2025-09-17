import React, { useState, useContext } from 'react'
import { LightDark, SelectedProduct, CartModalBoolean } from '../contexts/contexts'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/NavBar';
import './DrinkInfo.css'
import AddItems from '../components/AddItems';
import AxiosInstance from '../components/Axios.jsx';
import CartModal from '../components/CartModal.jsx';

const DrinkInfo = () => {
  const { selecteddrink, setSelectedDrink } = useContext(SelectedProduct);
  const { theme, setTheme } = useContext(LightDark);
  const [num, setNum] = useState(0);
  const [cartModal, setCartModal] = useState(false);

  // Use the new auth context
  const { accessToken, isLoggedIn } = useAuth();

  const addToCart = (e, num) => {
    if (isLoggedIn && accessToken) {
      const request = async () => {
        await AxiosInstance.post(
          '/api/cart/items/',
          {"drink_id": e, "quantity": num},
          {headers:{Authorization: `Bearer ${accessToken}`}})
      }
      request();
      setCartModal(true);
    } else {
      alert('Log in to add to cart and place orders');
    }
  }

  return (
    <div className='drinkinfowrapper' id={theme}>
        <NavBar />
        <img src= {`http://127.0.0.1:8000${selecteddrink.image}`} className='drinkimage' />
        <div className='drinkname'>
          {selecteddrink.name}
        </div>
        <div className='drinkprice'>
          R{selecteddrink.price}
        </div>
        <AddItems prod={selecteddrink} num={num} setNum={setNum} />
        <button className='addtocart' onClick={() => {addToCart(selecteddrink.id, num)}}>Add to cart</button>
        <div className="drink-info-cartmodal-wrapper">
          <CartModalBoolean.Provider value={{cartModal, setCartModal}}>
            {cartModal && <CartModal/>}
          </CartModalBoolean.Provider>
        </div>
    </div>
  )
}

export default DrinkInfo