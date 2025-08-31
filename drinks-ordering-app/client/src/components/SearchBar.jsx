import React, { useContext } from 'react'
import { AlcoholicFilter, DrinkCategory, Search } from '../contexts/contexts';
import { useRef } from 'react';
import './SearchBar.css';
import { BsSearch } from "react-icons/bs";

const SearchBar = () => {
    const {search, setSearch} = useContext(Search);
    const searchterms = useRef('');
    const submit = useRef(null);
    const {alcoholicfilter, setAlcoholicFilter} = useContext(AlcoholicFilter);
    const {category, setCategory} = useContext(DrinkCategory);

    console.log('category', category);

  return (
    <>
        <form onSubmit={(e) => {setSearch(searchterms.current.value); e.preventDefault();}}>
            <div className='searchwrap'>
                <input type='search' className='search' ref={searchterms} placeholder='Search' onChange={(e) => {submit.current.click(); e.preventDefault();}}/>
                <input type='submit' ref={submit} style={{display:'none'}}/>
                <select value={category} className='selectcategory' onChange={(e) => {setCategory(e.target.value)}}>
                  <option value='all'>All Drinks</option>
                  <option value='alcoholic'>Alcoholic</option>
                  <option value='nonalcoholic'>Non-Alcoholic</option>
                </select>
            </div>
        </form>
    </>
  )
}

export default SearchBar
