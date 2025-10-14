import { render } from '@testing-library/react';
import React, { useState } from 'react';
import CartModal from '../components/CartModal.jsx';
import { CartModalBoolean } from '../contexts/contexts.jsx';

describe('CartModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('auto-disables cart modal after timeout', () => {
    const setCartModal = vi.fn();
    function Wrapper() {
      const [cartModal, _setCartModal] = useState(true);
      return (
        <CartModalBoolean.Provider value={{ cartModal, setCartModal: (v) => { _setCartModal(v); setCartModal(v); } }}>
          <CartModal />
        </CartModalBoolean.Provider>
      );
    }
    render(<Wrapper />);
    vi.advanceTimersByTime(1000);
    expect(setCartModal).toHaveBeenCalledWith(false);
  });
});
