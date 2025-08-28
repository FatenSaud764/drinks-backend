import React, { useContext } from 'react'
import { AlcoholicFilter, Search } from '../contexts/contexts';
import { useRef } from 'react';
import './SearchBar.css';
import { BsSearch } from "react-icons/bs";

const SearchBar = () => {
    const {search, setSearch} = useContext(Search);
    const searchterms = useRef('');
    const submit = useRef(null);
    const {alcoholicfilter, setAlcoholicFilter} = useContext(AlcoholicFilter);


  return (
    <>
        <form onSubmit={(e) => {setSearch(searchterms.current.value); e.preventDefault();}}>
            <div className='searchwrap'>
                <input type='search' className='search' ref={searchterms} placeholder='Search' onChange={(e) => {submit.current.click(); e.preventDefault();}}/>
                <input type='submit' ref={submit} style={{display:'none'}}/>
                <button className='submitsearch' onClick={(e) => {submit.current.click(); e.preventDefault();}}><BsSearch className='searchicon' /></button>
                <button className='filter' onClick={() => {if(alcoholicfilter=="alcoholic") {setAlcoholicFilter("non-alcoholic")} else{setAlcoholicFilter("alcoholic")}}}>{alcoholicfilter.toUpperCase()}</button>
            </div>
        </form>
    </>
  )
}

export default SearchBar
