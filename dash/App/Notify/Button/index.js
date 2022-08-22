import React from 'react'

export function DisabledSubmitButton ({ text }) {
  return (
    <div role='button' className='addTokenSubmit'>{text}</div>
  )
}

function SubmitButton ({ text, handleClick, extraClasses = [] }) {
  const classes = ['addTokenSubmit', 'addTokenSubmitEnabled'].concat(extraClasses).join(' ')

  return (
    <div
      role='button'
      className={classes} 
      onMouseDown={(evt) => {
        // left click
        if (evt.button === 0) {
          handleClick()
        }
      }}
    >
      {text}
    </div>
  )
}

export function GoodSubmitButton (props) {
  const buttonProps = { ...props, extraClasses: ['addTokenSubmitGood'] }
  return <SubmitButton {...buttonProps} />
}

export function BadSubmitButton (props) {
  const buttonProps = { ...props, extraClasses: ['addTokenSubmitBad'] }
  return <SubmitButton {...buttonProps} />
}
