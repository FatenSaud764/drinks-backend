import { useState } from 'react';

export default function App() {
  const [orders, setOrders] = useState(['Beer', 'Cocktail']);

  return (
    <div>
      <h1>Bar Order Queue</h1>
      <ul>{orders.map((o, i) => <li key={i}>{o}</li>)}</ul>
    </div>
  );
}

