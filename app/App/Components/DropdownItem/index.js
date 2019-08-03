import React from 'react'
import Restore from 'react-restore'

const DropdownItem = ({ name, index, onSelect }, context) => {
  return (
    <div className='dropdownItem' onMouseDown={() => onSelect(index)}>{ name }</div>
  )
}

export default Restore.connect(DropdownItem)
