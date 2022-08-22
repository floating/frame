import React from 'react'

export function DisabledSubmitButton ({ text }) {
  return (
    <div role='button' className='addTokenSubmit'>{text}</div>
  )
}

function BasicSubmitButton ({ text, handleClick, extraClasses = [] }) {
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

export function SubmitButton (props) {
  const buttonProps = { ...props, extraClasses: ['addTokenSubmitGood'] }
  return <BasicSubmitButton {...buttonProps} />
}

export function DangerousSubmitButton (props) {
  const buttonProps = { ...props, extraClasses: ['addTokenSubmitBad'] }
  return <BasicSubmitButton {...buttonProps} />
}
