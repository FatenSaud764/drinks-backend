import React, { useContext, useEffect } from 'react'
import NavBar from '../components/NavBar'
import { LightDark, ProductList, UserCart } from '../contexts/contexts'
import { useAuth } from '../contexts/AuthContext'
import './Cart.css'
import { useState } from 'react'
import AxiosInstance from '../components/Axios'
import { FaRegTrashCan } from "react-icons/fa6";

const Cart = () => {
  const { theme, setTheme } = useContext(LightDark)
  const { products, setProducts } = useContext(ProductList)
  const { cart, setCart } = useContext(UserCart);
  const [cartItems, setCartItems] = useState([]);
  const [ orderNote, setOrderNote ] = useState("");
  const [ displayNote, setDisplayNote ] = useState("");

  // Use the new auth context
  const { accessToken, isLoggedIn } = useAuth();

  console.log('cart', cart);

  const fetchdata = async () => {
    if (!isLoggedIn || !accessToken) return;
    
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
    if (!isLoggedIn || !accessToken) return;
    updateNote();
    
    try {
      const result = await AxiosInstance.post('/api/orders/', cartItems, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      console.log('order', result.data)
      alert("Placed order!")
      fetchdata()
    } catch (err) {
      console.error(err);
    }
  }

  const ClearCart = async() => {
    if (!isLoggedIn || !accessToken) return;
    
    try{
      await AxiosInstance.delete('/api/cart/', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      fetchdata();
    }
    catch(err) {
      console.error(err);
    }
  }

  // Save to localStorage whenever cartItems changes
  useEffect(() => {
    fetchdata();
  }, [accessToken, isLoggedIn])

  const increment = (quantity, drink_id) => {
    if (!isLoggedIn || !accessToken) return;
    
    const new_quantity = quantity + 1;
    const update = async () => {
      try {
        setCartItems(prevCartItems =>
          prevCartItems.map(item =>
            item.drink_id === drink_id ? { ...item, quantity: item.quantity + 1 } : item
          )
        );
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

  const decrement = (quantity, drink_id) => {
    if (!isLoggedIn || !accessToken) return;
    
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

  const updateNote = async () => {
    if (!isLoggedIn || !accessToken) return;

    try {
      const res = await AxiosInstance.patch('/api/cart/', {
        note: orderNote
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchdata();
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  // Show login message if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="cartwrapper" id={theme}>
        <NavBar />
        <div className="cart-items">
          <p className="empty-cart">Please log in to view your cart.</p>
        </div>
      </div>
    )
  }

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
        {cartItems.length > 0 && 
          <div className='add-note-wrapper'>
            <form className='add-note-form' onSubmit={updateNote}>
              <textarea 
                maxlength="128"
                className='new-note-text'
                type='textarea'
                value={orderNote}
                placeholder='Enter a note for your order...'
                onChange={(e)=>setOrderNote(e.target.value)}
              />
            </form>
          </div>
        }
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
