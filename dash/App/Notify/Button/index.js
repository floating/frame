import React from 'react'
import link from '../../../../resources/link'

export function DisabledSubmitButton ({ text }) {
  return (
    <div role='button' className='addTokenSubmit'>{text}</div>
  )
}

export function SubmitButton ({ text, handleClick }) {
  return (
    <div
      role='button'
      className='addTokenSubmit addTokenSubmitEnabled' 
      onMouseDown={() => {
        handleClick()
        setTimeout(() => {
          link.send('tray:action', 'backDash')
        }, 400)
      }}
    >
      {text}
    </div>
  )
}
