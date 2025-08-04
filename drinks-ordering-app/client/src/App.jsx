import { DRINKS, ORDER_STATUS, formatDate, SharedButton } from 'shared';

export default function App() {
  const handleOrder = (drink) => {
    const timestamp = formatDate(new Date().toISOString());
    alert(`Ordered ${drink} at ${timestamp}`);
  };

  return (
    <div>
      <h1>Client Menu</h1>
      {DRINKS.map((drink) => (
        <SharedButton key={drink} onClick={() => handleOrder(drink)}>
          Order {drink}
        </SharedButton>
      ))}
    </div>
  );
}

