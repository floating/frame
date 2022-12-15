import { useEffect, useRef, useState, useCallback } from 'react'

import { debounce } from '../../../../../resources/utils'

export function PasswordInput({ getError, nextStep, title, buttonText }) {
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
    inputRef.current.addEventListener('input', debounceInput)
    //TODO: Do we need to do this, does react handle it?
    // return () => {
    //   inputRef.current.removeEventListener('input', debounceInput)
    // }
  })

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
    nextStep(value)
  }

  return (
    <div style={{ textAlign: 'center', width: '100%' }} className='addAccountItemOptionSetupFrame'>
      <div className='addAccountItemOptionTitle'>{title}</div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div className='addAccountItemOptionInputPhrase addAccountItemOptionInputPassword'>
        <div className='addAccountItemOptionSubtitle'>password must be 12 characters or longer</div>
        <form onSubmit={handleSubmit}>
          <input
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
        <div className={'addAccountItemOptionSubmit'} onMouseDown={handleSubmit}>
          {buttonText}
        </div>
      )}
    </div>
  )
}
