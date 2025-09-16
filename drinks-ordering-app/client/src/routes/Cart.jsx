import React, { useContext, useEffect } from 'react'
import NavBar from '../components/NavBar'
import { AccessTokens, LightDark, ProductList, UserCart } from '../contexts/contexts'
import './Cart.css'
import { useState } from 'react'
import AxiosInstance from '../components/Axios'
import { FaRegTrashCan } from "react-icons/fa6";

const Cart = () => {
  const { theme, setTheme } = useContext(LightDark)
  const { products, setProducts } = useContext(ProductList)
  const { accessToken, refreshToken } = useContext(AccessTokens);
  const { cart, setCart } = useContext(UserCart);
  console.log('cart', cart);
  const [cartItems, setCartItems] = useState([]);

  const fetchdata = async () => {
    try {
      const res = await AxiosInstance.get('api/cart/', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setCartItems(res.data.items);
      console.log('my cart', cartItems);
    } catch (err) {
      console.error(err);
    }
  }

  const PlaceOrder = async() => {
    try {
    const result = await AxiosInstance.post('/api/orders/', cartItems, {headers : {Authorization: `Bearer ${accessToken}`}})
    console.log('order', result.data)
    alert("Placed order!")
    fetchdata()
  } catch (err) {
    console.error(err);
  }
  }

  const ClearCart = async() => {
    try{
      await AxiosInstance.delete('/api/cart/', {headers: {Authorization: `Bearer ${accessToken}`}})
      fetchdata();
    }
    catch(err) {
      console.error(err);
    }
  }


  // Save to localStorage whenever cartItems changes
  useEffect(() => {
    fetchdata();
  }, [])

  const increment = (quantity, drink_id) => {
    const new_quantity = quantity + 1;
    const update = async () => {
      try {
        setCartItems(prevCartItems =>
          prevCartItems.map(item =>
            item.drink_id === drink_id ? { ...item, quantity: item.quantity + 1 } : item
          )
        );
        const res = await AxiosInstance.patch(`/api/cart/`, { items: [{ "id": cart.id, "drink_id": drink_id, quantity: new_quantity }] }, { headers: { Authorization: `Bearer ${accessToken}` } });
      }
      catch (err) {
        console.error(err);
      }
    }
    update();
  };

  const decrement = (quantity, drink_id) => {
    const new_quantity = quantity - 1;
    const update = async () => {
      try {
        // Update UI immediately, even if quantity becomes 0
        setCartItems(prevCartItems =>
          prevCartItems.map(item =>
            item.drink_id === drink_id ? { ...item, quantity: item.quantity - 1 } : item
          )
        );

        // Send update to backend
        const res = await AxiosInstance.patch(`/api/cart/`, {
          items: [{ "id": cart.id, "drink_id": drink_id, quantity: new_quantity }]
        }, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
      catch (err) {
        console.error(err);
      }
    }
    update();
  };

  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };


  const totalPrice = cartItems.reduce((sum, item) => sum + products.filter(product => { return product.id === item.drink_id }).map(product => product.price) * item.quantity, 0);

  return (
    <div className="cartwrapper" id={theme}>
      <NavBar />
      <div className='cart-items'>
        <div className="cart-items-list">
          {cartItems.length === 0 ? (
            <p className="empty-cart">Your cart is empty.</p>
          ) : (
            <ul className='cart-items-list'>
              {cartItems.sort((a, b) => a.drink_id < b.drink_id).map((item, i) => (
                <li key={item.id} className="cart-item">
                  <div className="item-info">
                    <span className="item-name">{products.filter(product => { return product.id === item.drink_id }).map(product => product.name)}</span>
                    <span className="item-price">R {products.filter(product => { return product.id === item.drink_id }).map(product => product.price)}</span>
                  </div>
                  <div className="item-controls">
                    <button onClick={() => {
                      if (item.quantity > 0) {
                        decrement(item.quantity, item.drink_id)
                      }
                    }}>-</button>
                    <span className="item-qty">{cartItems[i].quantity}</span>
                    <button onClick={() => { if (item.quantity < products.filter(product => { return product.id === item.drink_id }).map(product => product.stock)) { increment(item.quantity, item.drink_id) } else { alert("Not enough stock!") } }}>+</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {cartItems.length>0 && 
      <div className='clearcart'>
        <span className='clearcarttext'>Clear Cart</span>
        <button className='clearcartbutton' onClick={() => {ClearCart()}}><FaRegTrashCan className='clearicon'/></button>
      </div>
        }
      </div>
      
      {cartItems.length > 0 && (
        <div className="cart-footer">
          <span>Total: R {totalPrice}</span>
          <button className="checkout-btn" onClick={() => {PlaceOrder()}}>Checkout</button>
        </div>
      )}
    </div>
  )
}

export default Cart
