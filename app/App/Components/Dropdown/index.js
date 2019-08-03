import React, { useState } from 'react'
import styles from './style'
import DropdownItem from '../DropdownItem'

const findIndex = (options, value) => {
  const index = options.findIndex((option) => option.value === value)
  return index >= 0 ? index : null
}

const Dropdown = ({ options, selected, onChange }) => {
  // Hooks
  const [index, setIndex] = useState(findIndex(options, selected) || 0)
  const [expanded, setExpanded] = useState(false)

  // Style: container
  const height = (options.length * 26) + 'px'
  const styleContainer = styles.container.common
  const styleContainerExpanded = { ...styles.container.common, ...styles.container.expanded, height }

  // Style: items
  const marginTop = (-26 * index) + 'px'
  const styleItems = { ...styles.items, marginTop }
  const styleItemsExpanded = styles.items

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
    <div className='Dropdown' style={expanded ? styleContainerExpanded : styleContainer} onMouseDown={(e) => { setExpanded(!expanded) }}>
      <div className='DropdownItems' style={expanded ? styleItemsExpanded : styleItems}>
        { options.map((option, index) => {
          return <DropdownItem name={option.name} index={index} onSelect={handleSelect} />
        })}
      </div>
    </div>
  )
}

export default Dropdown
