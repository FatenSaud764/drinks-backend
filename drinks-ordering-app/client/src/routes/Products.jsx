import React, { createContext, useContext, useState } from 'react'
import './Products.css'
import { AlcoholicFilter, DrinkCategory, LightDark, ProductList, SelectedProduct } from '../contexts/contexts';
import ThemeButton from '../components/ThemeButton';
import { TiShoppingCart } from "react-icons/ti";
import { AiOutlineMenu } from "react-icons/ai";
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar.jsx';
import { Search } from '../contexts/contexts';
import nostock from 'shared/assets/soldout.png'
import Fuse from 'fuse.js'
import { useMemo } from 'react';
import AddItems from '../components/AddItems.jsx';
import NavBar from '../components/NavBar.jsx';
import CartModal from '../components/CartModal.jsx';
export const CartModalBoolean = createContext(false);


const Products = () => {
  const {products, setProducts} = useContext(ProductList);
  const {theme, setTheme} = useContext(LightDark);
  const navigate = useNavigate();
  const {search, setSearch} = useContext(Search);
  const {selecteddrink, setSelectedDrink} = useContext(SelectedProduct);
  const {alcoholicfilter, setAlcoholicFilter} = useContext(AlcoholicFilter);
  const {category, setCategory} = useContext(DrinkCategory);
  const keys = ['name'];
  const [cartModal, setCartModal] = useState(false);
  const [drinkAdded, setDrinkAdded] = useState('');


  const fuse = useMemo(() => {
  return new Fuse(products, {
    keys: keys,
    threshold: 0.4
  });
}, [products, keys]);

  console.log('search' , search);

  const filtered = search === '' ? products : fuse.search(search).map(result => result.item);

  const sortedProducts = [...filtered].sort((a, b) => {
  return (a.available === b.available) ? 0 : a.available ? -1 : 1;
}).sort((a,b) => {if(a.available && b.available) {return a.name.localeCompare(b.name)}}).filter((a) => {return category==="alcoholic" ? a.category==="Alcoholic" : category==="nonalcoholic" ? a.category==="Non-Alcoholic" : a});

  return (
    <div className='prodwrapper' id={theme}>
      <NavBar />
      <div className='prodplussearch'>
        <div><SearchBar /></div>
        <CartModalBoolean.Provider value={{cartModal, setCartModal}}>
        {cartModal && <CartModal/>}
        </CartModalBoolean.Provider>
        <div className='prodlist'>
        {sortedProducts.map((product) => {
          
          return(
              <div key={product.id} className='productdisplay'>
              <button className='productbutton' onClick={() => {if(product.available){setSelectedDrink(product); navigate('/drinkinfo');}}}><img src={product.available ? `http://127.0.0.1:8000${product.image}` : nostock} className='drinkcard'/></button>
              <div className='productdesc'>{product.name}</div>
              <div className='additemwrapper'>
              <div className='productprice'>R{product.price}</div>
              {product.available && <button className='additem' onClick={() => {setCartModal(true); }}>+</button>}
              </div>
              </div>
        
          )
        })}
        </div>
      <div className='footer'></div>
      </div>
    </div>
  )
}

export default Products
