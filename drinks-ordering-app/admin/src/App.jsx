import { useState } from 'react';
import 'shared/styles/Theme.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'shared/contexts/ThemeContext';
import 'shared/styles/Theme.css';
import 'shared/styles/Global.css';
import ThemeToggle from 'shared/components/ThemeToggle';

export default function App() {
  const [orders, setOrders] = useState(['Beer', 'Cocktail']);

  return (
    <Router>
      <ThemeProvider>
        <div>
        <h1>Bar Order Queue</h1>
        <ul>{orders.map((o, i) => <li key={i}>{o}</li>)}</ul>
      </div>

      <ThemeToggle />

      </ThemeProvider>
    </Router>
  );
}
