import React, { createContext, useContext, useState, useEffect } from 'react'
import './Products.css'
import { AlcoholicFilter, DrinkCategory, LightDark, ProductList, SelectedProduct, CartModalBoolean, CartItems } from '../contexts/contexts';
import { useAuth } from '../contexts/AuthContext';
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
import CartModal from '../components/CartModal.jsx';
import NavBar from '../components/NavBar'
import AxiosInstance from '../components/Axios.jsx';
import { DRINK_CATEGORIES } from '../../../packages/shared/types.js';


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
  const {cartItems, setCartItems} = useContext(CartItems);

  // Use the new auth context
  const { accessToken, isLoggedIn } = useAuth();

  const fuse = useMemo(() => {
    return new Fuse(products, {
      keys: keys,
      threshold: 0.4
    });
  }, [products, keys]);


  const filtered = search === '' ? products : fuse.search(search).map(result => result.item);

  const sortedProducts = [...filtered].sort((a, b) => {
    return (a.available === b.available) ? 0 : a.available ? -1 : 1;
  }).sort((a,b) => {if(a.available && b.available) {return a.name.localeCompare(b.name)}}).filter((a) => {return category.toLowerCase() == "all" ? true : a.category.toLowerCase() == category.toLowerCase()});

const addToCart = async (e) => {
    if(isLoggedIn && accessToken){
      // Show modal IMMEDIATELY (optimistic)
      
      try {
        // Add to backend in background
        setCartModal(true)
        await AxiosInstance.post('/api/cart/items/', 
          {"drink_id": e, "quantity": 1}, 
          {headers:{Authorization: `Bearer ${accessToken}`}}
        )
        // Silently refetch to sync state (user already saw feedback)
        fetchdata()
        
      } catch (error) {
        console.error('Failed to add to cart:', error)
        // Revert optimistic update on error
        setCartModal(false)
        alert('Failed to add item to cart')
      }
    } else {
      alert('Log in to add to cart and place orders')
    }
}

  const fetchdata = async () => {
    if (!isLoggedIn || !accessToken) return;
    
    try {
      const res = await AxiosInstance.get('api/cart/', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setCartItems(res.data.items);
    } catch (err) {
      console.error(err);
    }
  }

  // Save to localStorage whenever cartItems changes
  useEffect(() => {
    fetchdata();
  }, [accessToken, isLoggedIn])

  return (
    <div className='prodwrapper' id={theme}>
      <NavBar />
      <CartModalBoolean.Provider value={{cartModal, setCartModal}}>
        {cartModal && <CartModal/>}
      </CartModalBoolean.Provider>
      <div className='prodplussearch'>
        <div><SearchBar /></div>
        <div className='prodlist'>
        {sortedProducts.map((product) => {
          
          return (
              <div key={product.id} className='productdisplay'>
              <button className='productbutton' onClick={() => {if(product.available && isLoggedIn && accessToken){setSelectedDrink(product); navigate('/drinkinfo');}}}><img src={product.available ? `{product.image}` : nostock} className='drinkcard'/></button>
              <div className='productdesc'>{product.name}</div>
              <div className='additemwrapper'>
              <div className='productprice'>R{product.price}</div>
              {product.available && <button className='additem' onClick={() => {if(cartItems || cartItems.find(item => item.drink_id===product.id).quantity<product.stock){addToCart(product.id)}}}>+</button>}
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