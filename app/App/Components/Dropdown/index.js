import React, { useState } from 'react'

const findIndex = (options, value) => {
  const index = options.findIndex((option) => option.value === value)
  return index >= 0 ? index : null
}

const Dropdown = ({ options, syncValue, initialValue, style, className, onChange }) => {
  // Get index for passed value(s)
  const syncIndex = findIndex(options, syncValue)
  const initialIndex = findIndex(options, initialValue)

  // Hooks
  const [index, setIndex] = useState(syncIndex || initialIndex || 0)
  const [expanded, setExpanded] = useState(false)

  // Handle new sync value
  if (syncIndex !== index) {
    setIndex(syncIndex)
  }

  // Handle item selected
  const handleSelect = (newIndex) => {
    // Trigger only on new item selected
    if (newIndex !== index) {
      // Return new value
      onChange(options[newIndex].value)
      // Update state
      setIndex(newIndex)
    }
  }

  // Style calculations
  const height = (options.length * 26) + 'px'
  const marginTop = (-26 * index) + 'px'

  // JSX
  return (
    <div
      className={expanded ? `dropdown dropdownExpanded ${className}` : `dropdown ${className}`}
      style={expanded ? { ...style, height } : { ...style }}
      onMouseDown={(e) => { setExpanded(!expanded) }}
    >
      <div className='dropdownItems' style={expanded ? {} : { marginTop }}>
        { options.map((option, index) => {
          return <div className='dropdownItem' onMouseDown={() => handleSelect(index)}>{ option.text }</div>
        })}
      </div>
    </div>
  )
}

export default Dropdown
