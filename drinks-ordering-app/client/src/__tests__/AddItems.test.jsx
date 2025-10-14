import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import AddItems from '../components/AddItems.jsx';
import { LightDark } from '../contexts/contexts.jsx';

describe('AddItems', () => {
  const prod = { stock: '3' };

  function Wrapper() {
    const [num, setNum] = useState(0);
    return (
      <LightDark.Provider value={{ theme: 'light', setTheme: () => {} }}>
        <AddItems prod={prod} num={num} setNum={setNum} />
      </LightDark.Provider>
    );
  }

  beforeEach(() => {
    global.alert = vi.fn();
  });

  it('increments and decrements within stock limits', () => {
    render(<Wrapper />);
    const buttons = screen.getAllByRole('button'); // [-] and [+]
    const minus = buttons[0];
    const plus = buttons[1];
    const qty = () => screen.getByText(/^[0-9]+$/);

    // increment to stock
    fireEvent.click(plus); // 1
    fireEvent.click(plus); // 2
    fireEvent.click(plus); // 3 (max)
    expect(qty().textContent).toBe('3');

    // attempt beyond stock triggers alert
    fireEvent.click(plus);
    expect(global.alert).toHaveBeenCalled();
    expect(qty().textContent).toBe('3');

    // decrement
    fireEvent.click(minus); // 2
    expect(qty().textContent).toBe('2');
    fireEvent.click(minus); // 1
    fireEvent.click(minus); // 0
    fireEvent.click(minus); // stays 0
    expect(qty().textContent).toBe('0');
  });
});
