import React, { useContext, useEffect } from 'react'
import NavBar from '../components/NavBar'
import { LightDark, ProductList } from '../contexts/contexts'
import './Cart.css'
import { useState } from 'react'

const Cart = () => {
  const {theme, setTheme} = useContext(LightDark)
  const {products, setProducts} = useContext(ProductList)

  const [cartItems, setCartItems] = useState(() => {
        try {
            const stored = localStorage.getItem('cart')
            if (stored && stored !== 'null') {
                return JSON.parse(stored)
            }
            return products || []
        } catch (error) {
            console.warn('Failed to parse cart from localStorage:', error)
            localStorage.removeItem('cart')
            return products || []
        }
    })

    // Save to localStorage whenever cartItems changes
    useEffect(() => {
          localStorage.setItem('cart', JSON.stringify(cartItems))
    }, [cartItems])


  const increment = (id) => {
    setCartItems(
      cartItems.map(item =>
        item.id === id ? { ...item, stock: item.stock + 1 } : item
      )
    );
  };

  const decrement = (id) => {
    setCartItems(
      cartItems.map(item => {
        if (item.id === id) {
          if (item.stock === 1) {
            return null;
          } else {
            return { ...item, stock: item.stock - 1 };
          }
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.stock, 0);
  console.log('items', cartItems);

  return (
      <div className="cartwrapper" id={theme}>
        <NavBar />
      <div className='cart-items'>
        <div className="cart-items-list">
          {cartItems.length === 0 ? (
          <p className="empty-cart">Your cart is empty.</p>
          ) : (
          <ul className='cart-items-list'>
            {cartItems.map(item => (
            <li key={item.id} className="cart-item">
            <div className="item-info">
              <span className="item-name">{item.name}</span>
              <span className="item-price">R {item.price}</span>
            </div>
            <div className="item-controls">
              <button onClick={() => decrement(item.id)}>-</button>
              <span className="item-qty">{item.stock}</span>
              <button onClick={() => increment(item.id)}>+</button>
            </div>
            </li>
            ))}
          </ul>
          )}
        </div>
      </div>
      {cartItems.length > 0 && (
        <div className="cart-footer">
          <span>Total: R {totalPrice}</span>
          <button className="checkout-btn">Checkout</button>
        </div>
      )}
    </div>
  )
}

export default Cart
