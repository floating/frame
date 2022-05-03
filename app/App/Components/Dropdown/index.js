import React, { useState, useEffect, createRef } from 'react'

const findIndex = (options, value) => {
  const index = options.findIndex((option) => option.value === value)
  return index >= 0 ? index : null
}

const Dropdown = ({ options, syncValue, initialValue, style, className, onChange, customClass = '' }) => {
  // Get index for passed value(s)
  const syncIndex = findIndex(options, syncValue)
  const initialIndex = findIndex(options, initialValue)

  // Hooks
  const [index, setIndex] = useState(syncIndex || initialIndex || 0)
  const [expanded, setExpanded] = useState(false)

  const ref = createRef()

  const clickHandler = (e) => {
    if (!e.composedPath().includes(ref.current)) {
      if (expanded) setExpanded(false)
    }
  }
  // On mount -> register listener for document clicks
  useEffect(() => {
    document.addEventListener('click', clickHandler)
    return () => {
      document.removeEventListener('click', clickHandler)
    }
  })

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

  const indicator = (option) => {
    let indicatorClass = 'dropdownItemIndicator'
    if (option.indicator === 'good') indicatorClass += ' dropdownItemIndicatorGood'
    if (option.indicator === 'bad') indicatorClass += ' dropdownItemIndicatorBad'
    return <div className={indicatorClass} />
  }

  // Style calculations
  const height = (options.length * 28) + 'px'
  const marginTop = (-28 * index) + 'px'

  className = className || ''

  // JSX
  return (
    <div className='dropdownWrap' ref={ref}>
      <div
        className={expanded ? `dropdown dropdownExpanded ${className} ${customClass}` : `dropdown ${className} ${customClass}`}
        style={expanded ? { ...style, height } : { ...style }}
        onClick={(e) => { setExpanded(!expanded) }}
      >
        <div className='dropdownItems' style={expanded ? {} : { marginTop }}>
          {options.map((option, index) => {
            const words = option.text.split(' ').slice(0, 3)
            const length = words.length === 3 ? 1 : words.length === 2 ? 3 : 10
            const text = words.map(w => w.substr(0, length)).join(' ')
            return (
              <div key={option.text + index} className='dropdownItem' onMouseDown={() => handleSelect(index)}>
                {text}
                {indicator(option)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Dropdown
