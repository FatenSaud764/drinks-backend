import { createContext } from 'react';

export const ProductList = createContext([{}]);
export const LightDark = createContext();
export const Search = createContext('');
export const SelectedProduct = createContext({});
export const Orders = createContext([{}]);
export const AlcoholicFilter = createContext();
export const DrinkCategory = createContext('');
export const LoggedIn = createContext(false);
export const UserCart = createContext([{}]);
export const SignUpModal = createContext(false);
export const AccessTokens = createContext(null);
export const RefreshTokens = createContext(null);
export const CartModalBoolean = createContext(false);
