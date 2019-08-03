import React, { useState } from 'react'
import DropdownItem from '../DropdownItem'

const findIndex = (options, value) => {
  const index = options.findIndex((option) => option.value === value)
  return index >= 0 ? index : null
}

const Dropdown = ({ options, selected, style, onChange }) => {
  // Hooks
  const [index, setIndex] = useState(findIndex(options, selected) || 0) // default
  const [expanded, setExpanded] = useState(false)

  // Style calculations
  const height = (options.length * 26) + 'px'
  const marginTop = (-26 * index) + 'px'

  // Callback: select
  const handleSelect = (newIndex) => {
    // Trigger only on new index
    if (newIndex !== index) {
      // Return new value
      onChange(options[newIndex].value)
      // Update state
      setIndex(newIndex)
    }
  }

  // JSX
  return (
    <div className={expanded ? 'dropdown dropdownExpanded' : 'dropdown dropdownContracted'} style={expanded ? { ...style, height } : { ...style }} onMouseDown={(e) => { setExpanded(!expanded) }}>
      <div className='dropdownItems' style={expanded ? {} : { marginTop }}>
        { options.map((option, index) => {
          return <DropdownItem name={option.name} index={index} onSelect={handleSelect} />
        })}
      </div>
    </div>
  )
}

export default Dropdown
