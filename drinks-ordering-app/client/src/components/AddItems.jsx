import React, { useContext, useState } from 'react'
import { LightDark } from '../contexts/contexts';
import './AddItems.css'

const AddItems = ({prod}) => {
  const [num, setNum] = useState(0);
  const {theme, setTheme} = useContext(LightDark);

  console.log('stock', parseInt(prod))


  return (
    <div className='additemswrapper' id={theme}>
      <button className='additembutton' onClick={() => {if(num>0){setNum(num-1);}}}>-</button>
      <p className='itemquantity'>{num}</p>
      <button className='additembutton' onClick={() => {if(num<parseInt(prod.stock)){setNum(num+1);}}}>+</button>
    </div>
  )
}

export default AddItems