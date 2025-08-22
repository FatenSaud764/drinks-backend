import React, { useContext } from 'react'
import { LightDark, SelectedProduct } from '../contexts/contexts'
import NavBar from '../components/NavBar';
import './DrinkInfo.css'

const DrinkInfo = () => {
    const {selecteddrink, setSelectedDrink} = useContext(SelectedProduct);
    const {theme, setTheme} = useContext(LightDark);

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
        <button className='addtocart' onClick={() => alert(`Added ${selecteddrink.name} to Cart!`)}>Add to Cart</button>
    </div>
  )
}

export default DrinkInfo
