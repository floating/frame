import React from 'react'
import { useEffect, useRef, useState, useCallback } from 'react'
import zxcvbn from 'zxcvbn'

import { debounce } from '../../utils'

function PasswordInput({ getError, next, title, buttonText }) {
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const inputRef = useRef(null)

  const debounceInput = useCallback(
    debounce(() => {
      const {
        current: { value }
      } = inputRef
      const err = getError(value)
      if (value) {
        setError(err)
        setReady(!err)
      }
    }, 300),
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
    setReady(false)
    setError('')
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

  return (
    <div style={{ textAlign: 'center', width: '100%' }} className='addAccountItemOptionSetupFrame'>
      <div data-testid='createPasswordTitle' className='addAccountItemOptionTitle'>
        {title}
      </div>
      {error && (
        <div data-testid='createPasswordErrorMessage' style={{ color: 'red' }}>
          {error}
        </div>
      )}
      <div className='addAccountItemOptionInputPhrase addAccountItemOptionInputPassword'>
        <div className='addAccountItemOptionSubtitle'>password must be 12 characters or longer</div>
        <form onSubmit={handleSubmit}>
          <input
            data-testid='createPasswordInput'
            autoFocus
            type='password'
            tabIndex='-1'
            ref={inputRef}
            onChange={() => {
              setError('')
              setReady(false)
            }}
          />
        </form>
      </div>
      {/* TODO: Maybe use CSS to make button clearly un-clickable rather than dissappearing? */}
      {ready && (
        <div
          data-testid='createPasswordButton'
          className={'addAccountItemOptionSubmit'}
          onMouseDown={handleSubmit}
        >
          {buttonText}
        </div>
      )}
    </div>
  )
}

export function CreatePassword({ onCreate }) {
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

export function ConfirmPassword({ password, onConfirm }) {
  const title = 'Confirm Password'
  const buttonText = 'create'

  const getError = (confirmedPassword) => {
    if (password !== confirmedPassword) return 'PASSWORDS DO NOT MATCH'
  }

  return <PasswordInput {...{ getError, next: onConfirm, title, buttonText }} />
}
