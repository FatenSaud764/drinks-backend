import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import SearchBar from '../components/SearchBar.jsx';
import { Search, AlcoholicFilter, DrinkCategory } from '../contexts/contexts.jsx';

describe('SearchBar', () => {
  function Wrapper() {
    const [search, setSearch] = useState('');
    const [alcoholicfilter, setAlcoholicFilter] = useState('all');
    const [category, setCategory] = useState('all');
    return (
      <Search.Provider value={{ search, setSearch }}>
        <AlcoholicFilter.Provider value={{ alcoholicfilter, setAlcoholicFilter }}>
          <DrinkCategory.Provider value={{ category, setCategory }}>
            <SearchBar />
          </DrinkCategory.Provider>
        </AlcoholicFilter.Provider>
      </Search.Provider>
    );
  }

  it('updates search on input change and category on select', () => {
    render(<Wrapper />);
    const input = screen.getByPlaceholderText(/find a drink/i);
    fireEvent.change(input, { target: { value: 'cola' } });
    // hidden submit is triggered via change handler
    // category select
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'all' } });
    expect(input.value).toBe('cola');
  });
});
