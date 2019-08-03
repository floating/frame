import React from 'react'
import Restore from 'react-restore'
import style from './style'

const DropdownItem = ({ name, index, onSelect }, context) => {
  return (
    <div className='DropdownItem' style={style} onMouseDown={() => onSelect(index)}>{ name }</div>
  )
}

export default Restore.connect(DropdownItem)
