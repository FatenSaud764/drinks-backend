import React, { useContext } from 'react'
import { AlcoholicFilter, DrinkCategory, Search } from '../contexts/contexts';
import { useRef } from 'react';
import './SearchBar.css';
import { BsSearch } from "react-icons/bs";
import { DRINK_CATEGORIES } from '../../../packages/shared/types.js';

const SearchBar = () => {
    const {search, setSearch} = useContext(Search);
    const searchterms = useRef('');
    const submit = useRef(null);
    const {alcoholicfilter, setAlcoholicFilter} = useContext(AlcoholicFilter);
    const {category, setCategory} = useContext(DrinkCategory);


  return (
    <>
        <form onSubmit={(e) => {setSearch(searchterms.current.value); e.preventDefault();}}>
            <div className='searchwrap'>
                <input type='search' className='search' ref={searchterms} placeholder='Search' onChange={(e) => {submit.current.click(); e.preventDefault();}}/>
                <select value={category} className='selectcategory' onChange={(e) => {setCategory(e.target.value)}}>
                  <option value='all'>All Drinks</option>
                  {Object.values(DRINK_CATEGORIES).map((drinkcategory) =>
                    <option key={drinkcategory} value={drinkcategory}>{drinkcategory.charAt(0).toUpperCase() + drinkcategory.slice(1).toLowerCase()}</option>
                  )}
                </select>
            </div>
        </form>
    </>
  )
}

export default SearchBar
