import { useState } from 'react'
import zxcvbn from 'zxcvbn'
import useFocusableRef from '../../Hooks/useFocusableRef'

import { debounce } from '../../utils'

const NO_PASSWORD_ENTERED = 'Enter password'

export const PasswordInput = ({ getError: getInputError, next, title, buttonText, autofocus }) => {
  const [error, setError] = useState(NO_PASSWORD_ENTERED)
  const inputRef = useFocusableRef(autofocus)
  const [disabled, setDisabled] = useState(false)

  const resetError = () => setError(NO_PASSWORD_ENTERED)

  const clear = () => {
    resetError()
    inputRef.current && (inputRef.current.value = '')
  }

  const handleSubmit = () => {
    next(inputRef.current.value)
    setTimeout(clear, 1_000)
  }

  const getError = () =>
    inputRef.current.value ? getInputError(inputRef.current.value) || '' : NO_PASSWORD_ENTERED

  const validateInput = () => {
    const err = getError()
    if (err) {
      setDisabled(true)
      return debounce(() => {
        setDisabled(false)
        setError(getError())
      }, 300)()
    }
    return setError(err)
  }

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
            if (!error && e.key === 'Enter' && !disabled) handleSubmit()
          }}
        />
      </div>

      {error ? (
        <div role='button' className='addAccountItemOptionError'>
          {error}
        </div>
      ) : (
        <div role='button' className='addAccountItemOptionSubmit' onClick={() => !disabled && handleSubmit()}>
          {buttonText}
        </div>
      )}
    </div>
  )
}

export const CreatePassword = ({ onCreate, autofocus }) => {
  const getError = (password) => {
    if (password.length < 12) return 'PASSWORD MUST BE 12 OR MORE CHARACTERS'
    const {
      feedback: { warning },
      score
    } = zxcvbn(password)
    if (score > 2) return

    return (warning || 'PLEASE ENTER A STRONGER PASSWORD').toUpperCase()
  }

  return (
    <PasswordInput
      getError={getError}
      next={onCreate}
      title='Create Password'
      buttonText='Continue'
      autofocus={autofocus}
    />
  )
}

export const ConfirmPassword = ({ password, onConfirm, autofocus }) => {
  const getError = (confirmedPassword) => {
    if (password !== confirmedPassword) return 'PASSWORDS DO NOT MATCH'
  }

  return (
    <PasswordInput
      getError={getError}
      next={onConfirm}
      title='Confirm Password'
      buttonText='Create'
      autofocus={autofocus}
    />
  )
}
