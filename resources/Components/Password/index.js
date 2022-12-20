import React from 'react'
import { useRef, useState } from 'react'
import zxcvbn from 'zxcvbn'

import { debounce } from '../../utils'

const NO_PASSWORD_ENTERED = 'Enter password'

const PasswordInput = ({ getError, next, title, buttonText }) => {
  const [error, setError] = useState(NO_PASSWORD_ENTERED)
  const inputRef = useRef(null)

  const resetState = () => setError(NO_PASSWORD_ENTERED)

  const handleSubmit = (e) => next(e.target.value)

  const validateInput = debounce((e) => {
    const value = e.target.value
    if (!value) return resetState()
    const err = getError(value)
    setError(err || '')
  }, 300)

  const buttonClasses = ['addAccountItemOptionSubmit'].concat(error ? ['error'] : []).join(' ')

  return (
    <div className='addAccountItemOptionSetupFrame'>
      <div data-testid='createPasswordTitle' className='addAccountItemOptionTitle'>
        {title}
      </div>
      <div className='addAccountItemOptionInputPhrase addAccountItemOptionInputPassword'>
        <div className='addAccountItemOptionSubtitle'>password must be 12 characters or longer</div>
        <input
          data-testid='createPasswordInput'
          type='password'
          tabIndex='-1'
          ref={inputRef}
          onChange={validateInput}
          onKeyDown={(e) => {
            if (!error && e.key === 'Enter') handleSubmit(e)
          }}
        />
      </div>

      <div
        data-testid='createPasswordButton'
        className={buttonClasses}
        onMouseDown={(e) => !error && handleSubmit(e)}
      >
        {error || buttonText}
      </div>
    </div>
  )
}

export const CreatePassword = ({ onCreate }) => {
  const title = 'Create Password'
  const buttonText = 'Continue'

  const getError = (password) => {
    if (password.length < 12) return 'PASSWORD MUST BE AT LEAST 12 CHARACTERS LONG'
    const {
      feedback: { warning },
      score
    } = zxcvbn(password)
    if (score > 2) return

    return (warning || 'PLEASE ENTER A STRONGER PASSWORD').toUpperCase()
  }

  return <PasswordInput {...{ getError, next: onCreate, title, buttonText }} />
}

export const ConfirmPassword = ({ password, onConfirm }) => {
  const title = 'Confirm Password'
  const buttonText = 'create'

  const getError = (confirmedPassword) => {
    if (password !== confirmedPassword) return 'PASSWORDS DO NOT MATCH'
  }

  return <PasswordInput {...{ getError, next: onConfirm, title, buttonText }} />
}
