import React, { useContext } from 'react'
import { LightDark } from '../contexts/contexts';
import './AddItems.css'

const AddItems = ({prod, num, setNum}) => {
  const {theme, setTheme} = useContext(LightDark);

  console.log('stock', parseInt(prod))

  const updateCount = (num, plus) => {
    if (!plus && num > 0) {
      setNum(num - 1);
    } else if (plus && num < parseInt(prod.stock)) {
      setNum(num + 1);
    }
    else if(plus&&num===parseInt(prod.stock)){alert("Not enough stock!")}
  }

  return (
    <div className='additemswrapper' id={theme}>
      <button className='additembutton' onClick={() => {updateCount(num, false)}}>-</button>
      <p className='itemquantity'>{num}</p>
      <button className='additembutton' onClick={() => {updateCount(num, true)}}>+</button>
    </div>
  )
}

export default AddItems
