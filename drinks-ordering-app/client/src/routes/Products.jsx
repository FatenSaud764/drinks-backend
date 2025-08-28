import React, { useContext } from 'react'
import './Products.css'
import { AlcoholicFilter, LightDark, ProductList, SelectedProduct } from '../contexts/contexts';
import ThemeButton from '../components/ThemeButton';
import { TiShoppingCart } from "react-icons/ti";
import { AiOutlineMenu } from "react-icons/ai";
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar.jsx';
import { Search } from '../contexts/contexts';
import nostock from 'shared/assets/soldout.png'
import Fuse from 'fuse.js'
import { useMemo } from 'react';


const Products = () => {
  const {products, setProducts} = useContext(ProductList);
  const {theme, setTheme} = useContext(LightDark);
  const navigate = useNavigate();
  const {search, setSearch} = useContext(Search);
  const {selecteddrink, setSelectedDrink} = useContext(SelectedProduct);
  const {alcoholicfilter, setAlcoholicFilter} = useContext(AlcoholicFilter);
  const keys = ['name'];


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
});
  const sortedProducts2 = [... sortedProducts].sort((a,b) => {if(a.available && b.available) {return a.name.localeCompare(b.name)}})

  return (
    <div className='prodwrapper' id={theme}>
      <div className='nav'>
        <div className='navbuttons'>
        <div className='themeprod'><ThemeButton /></div>
        <button className='cart' onClick={() => {navigate('/Cart')}}><TiShoppingCart className='carticon'/></button>
        <button className='menu'><AiOutlineMenu className='menuicon' /></button>
        </div>
      </div>
      <div><SearchBar /></div>
      <div className='prodlist'>
      {sortedProducts2.map((product) => {
        return(
            <div key={product.id} className='productdisplay'>
            <button className='productbutton' onClick={() => {if(product.available){setSelectedDrink(product); navigate('/drinkinfo');}}}><img src={product.available ? `http://127.0.0.1:8000${product.image}` : nostock} className='drinkcard'/></button>
            <div className='productdesc'>{product.name}</div>
            </div>
        )
      })}
      </div>
    </div>
  )
}

export default Products
