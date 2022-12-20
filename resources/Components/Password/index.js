import React from 'react'
import { useEffect, useRef, useState, useCallback } from 'react'
import zxcvbn from 'zxcvbn'

import { debounce } from '../../utils'

const PasswordInput = ({ getError, next, title, buttonText }) => {
  const [error, setError] = useState('Enter password')
  const inputRef = useRef(null)

  const debounceInput = useCallback(
    debounce(() => {
      const {
        current: { value }
      } = inputRef
      if (!value) return resetState()
      const err = getError(value)
      if (value) {
        setError(err)
      }
    }, 500),
    [debounce]
  )

  useEffect(() => {
    const element = inputRef.current
    element.addEventListener('input', debounceInput)
    return () => {
      element.removeEventListener('input', debounceInput)
    }
  }, [])

  const resetState = () => {
    setError('Enter password')
  }

  const handleSubmit = () => {
    const {
      current: { value }
    } = inputRef
    const passwordError = getError(value)
    if (passwordError) return setError(passwordError)
    resetState()
    next(value)
  }

  const buttonClasses = ['addAccountItemOptionSubmit'].concat(error ? ['error'] : []).join(' ')

  return (
    <div className='addAccountItemOptionSetupFrame'>
      <div data-testid='createPasswordTitle' className='addAccountItemOptionTitle'>
        {title}
      </div>
      <div className='addAccountItemOptionInputPhrase addAccountItemOptionInputPassword'>
        <div className='addAccountItemOptionSubtitle'>password must be 12 characters or longer</div>
        <form onSubmit={handleSubmit}>
          <input
            data-testid='createPasswordInput'
            type='password'
            tabIndex='-1'
            ref={inputRef}
            onChange={() => {
              setError('')
            }}
          />
        </form>
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
