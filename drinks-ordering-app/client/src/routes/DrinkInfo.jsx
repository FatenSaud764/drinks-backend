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
        <img src= {`http://127.0.0.1:8000${selecteddrink.image}`} className='drinkimage' />
        <div className='drinkname'>
          {selecteddrink.name}
        </div>
        <div className='drinkprice'>
          R{selecteddrink.price}
        </div>
        <div className='radiobuttons'>
          <label className='sizeselect'>
          <input type='radio' value='small' onChange={(e) => setSelectedSize(e.target.value)} checked={selectedSize==='small'}/>
          Small drink
        </label>
        <label className='sizeselect'>
          <input type='radio' value='medium' onChange={(e) => setSelectedSize(e.target.value)} checked={selectedSize==='medium'}/>
          Medium drink
        </label>
        <label className='sizeselect'>
          <input type='radio' value='large' onChange={(e) => setSelectedSize(e.target.value)} checked={selectedSize==='large'}/>
          Large drink
        </label>
        </div>
        <AddItems prod={selecteddrink} num={num} setNum={setNum} />
        <button className='addtocart' onClick={() => {addToCart(selecteddrink.id, num)}}>Add to cart</button>
        <br />
    </div>
  )
}

export default DrinkInfo