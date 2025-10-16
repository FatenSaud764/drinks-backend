import React, { useContext, useEffect } from 'react'
import NavBar from '../components/NavBar'
import { LightDark, ProductList, CartItems } from '../contexts/contexts'
import { useAuth } from '../contexts/AuthContext'
import './Cart.css'
import { useState } from 'react'
import AxiosInstance from '../components/Axios'
import { FaRegTrashCan } from "react-icons/fa6";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert'
import Slide from '@mui/material/Slide'


const Cart = () => {
  const { theme, setTheme } = useContext(LightDark)
  const { products, setProducts } = useContext(ProductList)
  const { cartItems, setCartItems } = useContext(CartItems);
  const [open, setOpen] = useState(false);
  const [orderNote, setOrderNote] = useState("");


  const { accessToken, isLoggedIn } = useAuth();


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

  const PlaceOrder = async () => {
    if (!isLoggedIn || !accessToken) return;
    if (cartItems.length === 1 && cartItems[0].quantity === 0) {
      alert("You have no items in your cart!");
      return;
    }

    // Optimistic UI update first
    setOpen(true);
    const previousItems = [...cartItems];
    setCartItems([]);

    try {
      // Fire async work in parallel (don’t block UI)
      await Promise.all([
        await updateNote(),
        await AxiosInstance.post('/api/orders/', {}, orderNote, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      ]);
    } catch (err) {
      console.error(err);
      // Revert optimistic update on error
      setOpen(false);
      setCartItems(previousItems);
      alert('Failed to place order. Please try again.');
    }
  };



  const ClearCart = async () => {
    if (!isLoggedIn || !accessToken) return;
    setCartItems([]);
    try {
      await Promise.all([
        await AxiosInstance.delete('/api/cart/', {
          headers: { Authorization: `Bearer ${accessToken}` }
        }),
        fetchdata()
      ])

    }
    catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchdata();
  }, [accessToken, isLoggedIn])

  const increment = async (quantity, drink_id) => {
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
          items: [{ "drink_id": drink_id, quantity: new_quantity }]
        }, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
      catch (err) {
        console.error(err);
      }
    }
    await update();
  };

  const decrement = async (quantity, drink_id) => {
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
          items: [{ "drink_id": drink_id, quantity: new_quantity }]
        }, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
      catch (err) {
        console.error(err);
      }
    }
    await update();
  };


  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setOpen(false);
      }, 5000);

      return () => clearTimeout(timer); // Cleanup
    }
  }, [open]);

  const totalPrice = cartItems.reduce((sum, item) => sum + products.filter(product => { return product.id === item.drink_id }).map(product => product.price) * item.quantity, 0);

  const updateNote = async () => {
    if (!isLoggedIn || !accessToken) return;

    try {
      const res = await AxiosInstance.patch('/api/cart/', {
        note: orderNote
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
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
      <Snackbar open={open} onClose={() => { setOpen(false) }} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} sx={{ bottom: '4vh', left: '2vh' }}><Alert onClose={() => { setOpen(false) }} severity="success" sx={
        {
          display: 'flex',
          alignItems: 'center',
          width: '80vw',
          background: '#2563EB',
          color: 'white',
          '& .MuiAlert-icon': {
            alignItems: 'center',
            color: 'white',
          },
          '& .MuiAlert-message': {
            alignItems: 'center',
            fontWeight: '800',
            fontFamily: 'Roboto Slab',
            fontSize: '18px',
            color: 'white',
          }
        }
      }>Order placed! Please navigate to the "Orders" page to track your order!</Alert></Snackbar>
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
                    <span className="item-price">R {(products.filter(product => { return product.id === item.drink_id }).map(product => product.price) * 1.0 * item.quantity).toFixed(2)}</span>
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
            <form className='add-note-form'>
              <textarea
                maxLength="128"
                className='new-note-text'
                type='textarea'
                value={orderNote}
                placeholder='Enter a note for your order...'
                onChange={(e) => setOrderNote(e.target.value)}
              />
            </form>
          </div>
        }
        {cartItems.length > 0 &&
          <div className='clearcart'>
            <span className='clearcarttext'>Clear Cart</span>
            <button className='clearcartbutton' onClick={() => { ClearCart(); setCartItems([]); }}><FaRegTrashCan className='clearicon' /></button>
          </div>
        }
      </div>

      {cartItems.length > 0 && (
        <div className="cart-footer">
          <span style={{ fontWeight: '500', fontSize: '18px' }}>Total: R {totalPrice} <span style={{ fontWeight: '300' }}> (incl. VAT)</span></span>
          <button className="checkout-btn" onClick={() => { PlaceOrder() }}>Checkout</button>
        </div>
      )}
    </div>
  )
}

export default Cart
