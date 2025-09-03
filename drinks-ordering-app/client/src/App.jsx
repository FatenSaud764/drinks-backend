import {Routes, Route} from 'react-router-dom'
import Login from './routes/Login';
import Products from './routes/Products';
import Cart from './routes/Cart';
import './index.css';
import { createContext, useEffect, useState } from 'react';
import { LightDark, ProductList, Search, SelectedProduct, Orders, AlcoholicFilter, DrinkCategory, LoggedIn, UserCart, SignUpModal} from './contexts/contexts';
import AxiosInstance from './components/Axios';
import DrinkInfo from './routes/DrinkInfo';

const App = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [theme, setTheme] = useState(() => {return localStorage.getItem('theme') || 'dark';})
  const [alcoholicfilter, setAlcoholicFilter] = useState(() => {return localStorage.getItem('alcoholic filter') || "alcoholic";})
  const [search, setSearch] = useState('');
  const [selecteddrink, setSelectedDrink] = useState(() => {
  const stored = localStorage.getItem('selected');
  return stored ? JSON.parse(stored) : {};
});
  const [category, setCategory] = useState('all');
  const [loggedin, setLoggedIn] = useState(() => {const stored = localStorage.getItem('loggedin'); return stored ? stored : false})
  const [signupmodal, setSignUpModal] = useState(false);

  console.log('cart', cart);

const [orders, setOrders] = useState([{}]);

  const GetData = async () => {
    AxiosInstance.get('api/drink/').then((res) => {
      setProducts(res.data);
    })
  }

  const GetCartData = async () => {
    AxiosInstance.get('api/cart').then((res) => {setCart(res.data)});
  }

  const GetOrderData = async () => {
    AxiosInstance.get('api/orders/').then((res) => {
      setOrders(res.data);
    })
  }

  useEffect( () => {
    localStorage.setItem('selected', JSON.stringify(selecteddrink));
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth' // or 'auto' for instant jump
    });
  }, [selecteddrink])

  useEffect(() => {
    GetData();
    GetCartData();
  }, [])

  useEffect(()=>{
    localStorage.setItem('loggedin', loggedin)
  },[loggedin]);



  useEffect(() => {
        localStorage.setItem('theme', theme);
      }, [theme]);

  
  useEffect(() => {
        localStorage.setItem('alcoholic filter', alcoholicfilter);
      }, [alcoholicfilter]);

  return (
    <>
    <SignUpModal.Provider value={{signupmodal, setSignUpModal}}>
    <LoggedIn.Provider value={{loggedin, setLoggedIn}}>
    <DrinkCategory.Provider value={{category, setCategory}}>
    <AlcoholicFilter.Provider value={{alcoholicfilter, setAlcoholicFilter}}>
    <Orders.Provider value={{orders, setOrders}}>
    <SelectedProduct.Provider value={{selecteddrink, setSelectedDrink}}>
    <Search.Provider value={{search, setSearch}}>
    <LightDark.Provider value={{theme, setTheme}}>
    <ProductList.Provider value={{products, setProducts}}>
    <UserCart.Provider values={{cart, setCart}}>
    <Routes>
      <Route path='/' element={<Login />} />
      <Route path='/products' element={<Products />} />
      <Route path='/cart' element={<Cart />} />
      <Route path='/drinkinfo' element={<DrinkInfo />} />
    </Routes>
    </UserCart.Provider>
    </ProductList.Provider>
    </LightDark.Provider>
    </Search.Provider>
    </SelectedProduct.Provider>
    </Orders.Provider>
    </AlcoholicFilter.Provider>
    </DrinkCategory.Provider>
    </LoggedIn.Provider>
    </SignUpModal.Provider>
    </>
  );
}

export default App
