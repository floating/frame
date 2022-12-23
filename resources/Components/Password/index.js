import React from 'react'
import { useRef, useState } from 'react'
import zxcvbn from 'zxcvbn'

import { debounce } from '../../utils'

const NO_PASSWORD_ENTERED = 'Enter password'

const PasswordInput = ({ getError, next, title, buttonText }) => {
  const [error, setError] = useState(NO_PASSWORD_ENTERED)
  const inputRef = useRef(null)

  const resetError = () => setError(NO_PASSWORD_ENTERED)

  const clear = () => {
    resetError()
    inputRef.current && (inputRef.current.value = '')
  }

  const handleSubmit = () => {
    next(inputRef.current.value)
    setTimeout(clear, 600)
  }

  const validateInput = debounce((e) => {
    const value = e.target.value
    if (!value) return resetError()
    const err = getError(value)
    setError(err || '')
  }, 300)

  return (
    <div className='addAccountItemOptionSetupFrame'>
      <div role='heading' className='addAccountItemOptionTitle'>
        {title}
      </div>
      <div className='addAccountItemOptionInput addAccountItemOptionInputPassword'>
        <input
          role='textbox'
          type='password'
          tabIndex='-1'
          ref={inputRef}
          onChange={validateInput}
          onKeyDown={(e) => {
            if (!error && e.key === 'Enter') handleSubmit()
          }}
        />
      </div>

      {error ? (
        <div role='button' className='addAccountItemOptionError'>
          {error}
        </div>
      ) : (
        <div role='button' className='addAccountItemOptionSubmit' onClick={() => handleSubmit()}>
          {buttonText}
        </div>
      )}
    </div>
  )
}

export const CreatePassword = ({ onCreate }) => {
  const getError = (password) => {
    if (password.length < 12) return 'PASSWORD MUST BE 12 OR MORE CHARACTERS'
    const {
      feedback: { warning },
      score
    } = zxcvbn(password)
    if (score > 2) return

    return (warning || 'PLEASE ENTER A STRONGER PASSWORD').toUpperCase()
  }

  return <PasswordInput getError={getError} next={onCreate} title='Create Password' buttonText='Continue' />
}

export const ConfirmPassword = ({ password, onConfirm }) => {
  const getError = (confirmedPassword) => {
    if (password !== confirmedPassword) return 'PASSWORDS DO NOT MATCH'
  }

  return <PasswordInput getError={getError} next={onConfirm} title='Confirm Password' buttonText='Create' />
}
