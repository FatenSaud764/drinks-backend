import {Routes, Route} from 'react-router-dom'
import Login from './routes/Login';
import Products from './routes/Products';
import Cart from './routes/Cart';
import OrdersPage from './routes/Orders';
import './index.css';
import { createContext, useEffect, useState } from 'react';
import { LightDark, ProductList, Search, SelectedProduct, Orders, AlcoholicFilter, DrinkCategory, LoggedIn, UserCart, SignUpModal, AccessTokens, RefreshTokens} from './contexts/contexts';
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

  const [accessToken, setAccessToken] = useState(() => {const stored = localStorage.getItem('access token'); return stored ? stored : null});
  const [refreshToken, setRefreshToken] = useState(() => {const stored = localStorage.getItem('refresh token'); return stored ? stored : null});


const [orders, setOrders] = useState([{}]);

  const GetData = async () => {
    AxiosInstance.get('api/drink/').then((res) => {
      setProducts(res.data);
    })
  }

const GetCartData = async () => {
  try {
    const res = await AxiosInstance.get('api/cart/', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    setCart(res.data);
  } catch (err) {
    console.error(err);
  }
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
    localStorage.setItem('access token', accessToken);
  }, [accessToken])

  useEffect(() => {
    localStorage.setItem('refresh token', refreshToken);
  }, [refreshToken])

  useEffect(() => {
    GetCartData();
    GetData();
  }, [])

  console.log('cart', cart);

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
    <RefreshTokens.Provider value={{refreshToken, setRefreshToken}}>
    <AccessTokens.Provider value={{accessToken, setAccessToken}}>
    <SignUpModal.Provider value={{signupmodal, setSignUpModal}}>
    <LoggedIn.Provider value={{loggedin, setLoggedIn}}>
    <DrinkCategory.Provider value={{category, setCategory}}>
    <AlcoholicFilter.Provider value={{alcoholicfilter, setAlcoholicFilter}}>
    <Orders.Provider value={{orders, setOrders}}>
    <SelectedProduct.Provider value={{selecteddrink, setSelectedDrink}}>
    <Search.Provider value={{search, setSearch}}>
    <LightDark.Provider value={{theme, setTheme}}>
    <ProductList.Provider value={{products, setProducts}}>
    <UserCart.Provider value={{cart, setCart}}>
    <Routes>
      <Route path='/' element={!accessToken||accessToken=='null' ? <Login /> : <Products />} />
      <Route path='/products' element={<Products />} />
      <Route path='/cart' element={<Cart />} />
      <Route path='/drinkinfo' element={<DrinkInfo />} />
      <Route path='/orders' element={<OrdersPage />} />
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
    </AccessTokens.Provider>
    </RefreshTokens.Provider>
    </>
  );
}

export default App
