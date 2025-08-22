import {Routes, Route} from 'react-router-dom'
import Home from './routes/Home';
import Products from './routes/Products';
import Cart from './routes/Cart';
import './index.css';
import { createContext, useEffect, useState } from 'react';
import { LightDark, ProductList, Search, SelectedProduct, Orders, AlcoholicFilter} from './contexts/contexts';
import AxiosInstance from './components/Axios';
import DrinkInfo from './routes/DrinkInfo';

const App = () => {
  const [products, setProducts] = useState([]);
  const [theme, setTheme] = useState(() => {return localStorage.getItem('theme') || 'dark';})
  const [alcoholicfilter, setAlcoholicFilter] = useState(() => {return localStorage.getItem('alcoholic filter') || "alcoholic";})
  const [search, setSearch] = useState('');
  const [selecteddrink, setSelectedDrink] = useState(() => {
  const stored = localStorage.getItem('selected');
  return stored ? JSON.parse(stored) : {};
});


const [orders, setOrders] = useState([{}]);

  const GetData = async () => {
    AxiosInstance.get('api/drink/').then((res) => {
      setProducts(res.data);
    })
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
    GetOrderData();
  }, [])



  useEffect(() => {
        localStorage.setItem('theme', theme);
      }, [theme]);

  
  useEffect(() => {
        localStorage.setItem('alcoholic filter', alcoholicfilter);
      }, [alcoholicfilter]);

  return (
    <>
    <AlcoholicFilter.Provider value={{alcoholicfilter, setAlcoholicFilter}}>
    <Orders.Provider value={{orders, setOrders}}>
    <SelectedProduct.Provider value={{selecteddrink, setSelectedDrink}}>
    <Search.Provider value={{search, setSearch}}>
    <LightDark.Provider value={{theme, setTheme}}>
    <ProductList.Provider value={{products, setProducts}}>
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/products' element={<Products />} />
      <Route path='/cart' element={<Cart />} />
      <Route path='/drinkinfo' element={<DrinkInfo />} />
    </Routes>
    </ProductList.Provider>
    </LightDark.Provider>
    </Search.Provider>
    </SelectedProduct.Provider>
    </Orders.Provider>
    </AlcoholicFilter.Provider>
    </>
  );
}

export default App
