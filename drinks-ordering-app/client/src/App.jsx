import { Navigate } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom'
import Login from './routes/Login';
import Products from './routes/Products';
import Cart from './routes/Cart';
import OrdersPage from './routes/Orders';
import './index.css';
import { createContext, useEffect, useState, useRef } from 'react';
import { LightDark, ProductList, Search, SelectedProduct, Orders, AlcoholicFilter, DrinkCategory, UserCart, SignUpModal, CartItems, LoggedIn } from './contexts/contexts';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { setAuthContext } from './components/Axios';
import AxiosInstance from './components/Axios';
import DrinkInfo from './routes/DrinkInfo';
import Home from './routes/Home';
import NotFound from './routes/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, accessToken } = useAuth();

  if (!isLoggedIn || !accessToken || accessToken === 'null') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// App Content Component (needs to be inside AuthProvider to use useAuth so had to make this seperate)
const AppContent = () => {
  const { isLoggedIn, accessToken } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [theme, setTheme] = useState(() => { return localStorage.getItem('theme') || 'dark'; })
  const [alcoholicfilter, setAlcoholicFilter] = useState(() => { return localStorage.getItem('alcoholic filter') || "alcoholic"; })
  const [search, setSearch] = useState('');
  const [selecteddrink, setSelectedDrink] = useState(() => {
    const stored = localStorage.getItem('selected');
    return stored ? JSON.parse(stored) : {};
  });
  const [category, setCategory] = useState('all');
  const [signupmodal, setSignUpModal] = useState(false);
  const [orders, setOrders] = useState([{}]);
  const [cartItems, setCartItems] = useState([])

  const fetchControllerRef = useRef(null);

  const GetData = async () => {
    // Abort previous request if still running
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }

    const controller = new AbortController();
    fetchControllerRef.current = controller;

    try {
      const res = await AxiosInstance.get('api/drink/', {
        signal: controller.signal,
      });
      setProducts(res.data);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        console.error('Error fetching products:', err);
      }
    }
  };



  const GetCartData = async () => {
    if (!accessToken || accessToken === 'null') return;

    try {
      const res = await AxiosInstance.get('api/cart/');
      setCart(res.data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  }

  useEffect(() => {
    localStorage.setItem('selected', JSON.stringify(selecteddrink));
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [selecteddrink])

  useEffect(() => {
    GetData(); // Always fetch products
    const interval = setInterval(() => {
      GetData();
    }, 5000)
    return () => clearInterval(interval);
  }, [])

  

  useEffect(() => {
  const interval = setInterval(async () => {
    try {
      await fetch('https://drinks-backend-ojv2.onrender.com/api/ping/')
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);
      // console.log('Pinged backend to stay awake');
    } catch (err) {
      console.error('Ping failed:', err);
    }
  }, 5000); // every 5 minutes

  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    if (isLoggedIn && accessToken && accessToken !== 'null') {
      GetCartData(); // Only fetch cart if authenticated
    }
  }, [isLoggedIn, accessToken])

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('alcoholic filter', alcoholicfilter);
  }, [alcoholicfilter]);



  return (
    <DrinkCategory.Provider value={{ category, setCategory }}>
      <AlcoholicFilter.Provider value={{ alcoholicfilter, setAlcoholicFilter }}>
        <Orders.Provider value={{ orders, setOrders }}>
          <SelectedProduct.Provider value={{ selecteddrink, setSelectedDrink }}>
            <Search.Provider value={{ search, setSearch }}>
              <LightDark.Provider value={{ theme, setTheme }}>
                <ProductList.Provider value={{ products, setProducts }}>
                  <UserCart.Provider value={{ cart, setCart }}>
                    <SignUpModal.Provider value={{ signupmodal, setSignUpModal }}>
                      <CartItems.Provider value={{ cartItems, setCartItems }}>
                        <NotificationProvider>
                          <Routes>
                            <Route path='/' element={<Navigate to="/products" replace />} />
                            <Route path='/login' element={!isLoggedIn || !accessToken || accessToken === 'null' ? <Login /> : <Navigate to="/products" />} />
                            <Route path='/products' element={<Products />} />
                            <Route path='/cart' element={
                              <ProtectedRoute>
                                <Cart />
                              </ProtectedRoute>
                            } />
                            <Route path='/drinkinfo' element={
                              <ProtectedRoute>
                                <DrinkInfo />
                              </ProtectedRoute>
                            } />
                            <Route path='/orders' element={
                              <ProtectedRoute>
                                <OrdersPage />
                              </ProtectedRoute>
                            } />
                            <Route path='/home' element={<Home />} />
                            <Route path='*' element={<NotFound />} />
                          </Routes>
                        </NotificationProvider>
                      </CartItems.Provider>
                    </SignUpModal.Provider>
                  </UserCart.Provider>
                </ProductList.Provider>
              </LightDark.Provider>
            </Search.Provider>
          </SelectedProduct.Provider>
        </Orders.Provider>
      </AlcoholicFilter.Provider>
    </DrinkCategory.Provider>
  );
}

// Auth Context Connector Component
const AuthContextConnector = () => {
  const authContext = useAuth();

  useEffect(() => {
    setAuthContext(authContext);
  }, [authContext]);

  return null;
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <AuthContextConnector />
      <AppContent />
    </AuthProvider>
  );
}

export default App
