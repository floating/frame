import React from 'react'
import { useEffect, useRef, useState, useCallback } from 'react'

import RingIcon from '../../../../../resources/Components/RingIcon'
import { debounce } from '../../../../../resources/utils'
import link from '../../../../../resources/link'
import zxcvbn from 'zxcvbn'

const navForward = async (newAccountType, accountData) =>
  link.send('nav:forward', 'dash', {
    view: 'accounts',
    data: {
      showAddAccounts: true,
      newAccountType,
      accountData
    }
  })

const removeLineBreaks = (str) => str.replace(/(\r\n|\n|\r)/gm, '')

function AddHotAccountWrapper({ children, title, svgName, summary, intro }) {
  return (
    <div className={'addAccountItem addAccountItemSmart addAccountItemAdding'}>
      <div className='addAccountItemBar addAccountItemHot' />
      <div className='addAccountItemWrap'>
        <div className='addAccountItemTop'>
          <div className='addAccountItemTopType'>
            <div className='addAccountItemIcon'>
              <div className='addAccountItemIconType addAccountItemIconHot'>
                <RingIcon {...{ svgName }} />
              </div>
              <div className='addAccountItemIconHex addAccountItemIconHexHot' />
            </div>
            <div className='addAccountItemTopTitle'>{title}</div>
          </div>
          <div className='addAccountItemSummary'>{summary}</div>
        </div>
        <div className='addAccountItemOption'>
          <div
            className='addAccountItemOptionIntro'
            onMouseDown={() => {
              this.adding()
              setTimeout(
                () =>
                  link.send('tray:action', 'navDash', {
                    view: 'notify',
                    data: { notify: 'hotAccountWarning', notifyData: {} }
                  }),
                800
              )
            }}
          >
            {intro}
          </div>
          <div className='addAccountItemOptionSetupFrames'>{children}</div>
        </div>
        <div className='addAccountItemFooter' />
      </div>
    </div>
  )
}

function EnterSecret({ newAccountType, isValidSecret, title }) {
  const [secret, setSecret] = useState('')
  const [error, setError] = useState(null)

  const updateInput = (e) => {
    const value = removeLineBreaks(e.target.value)
    setSecret(value)
  }

  const handleSubmit = (e) => {
    if (e?.type !== 'mousedown' && e?.key !== 'Enter') {
      return
    }

    if (!isValidSecret(secret)) {
      return setError(`INVALID ${title.toUpperCase()}`)
    }

    return navForward(newAccountType, {
      secret
    })
  }

  return (
    <div style={{ textAlign: 'center', width: '100%' }} className='addAccountItemOptionSetupFrame'>
      <div data-testid='addHotAccountSecretTitle' className='addAccountItemOptionTitle'>
        {title}
      </div>
      {error && (
        <div data-testid='addHotAccountSecretError' style={{ color: 'red' }}>
          {error}
        </div>
      )}
      <div data-testid='addHotAccountSecretTextEntry' className='addAccountItemOptionInputPhrase'>
        <textarea autoFocus tabIndex='-1' value={secret} onChange={updateInput} onKeyDown={handleSubmit} />
      </div>
      <div
        data-testid='addHotAccountSecretSubmitButton'
        className='addAccountItemOptionSubmit'
        onMouseDown={handleSubmit}
      >
        Next
      </div>
    </div>
  )
}

function PasswordInput({ getError, nextStep, title, buttonText }) {
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

function CreatePassword({ secret, newAccountType }) {
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

  const nextStep = (password) =>
    navForward(newAccountType, {
      secret,
      password
    })

  return <PasswordInput {...{ getError, secret, nextStep, title, buttonText }} />
}

function ConfirmPassword({ password, secret, newAccountType, createSignerMethod }) {
  const title = 'Confirm Password'
  const buttonText = 'create'

  const getError = (confirmedPassword) => {
    if (password !== confirmedPassword) return 'PASSWORDS DO NOT MATCH'
  }

  //TODO: Finish this last step...  show an overview screen like with the watch accounts (button to go back // button to view new added account)?
  const nextStep = (password) =>
    link.rpc(createSignerMethod, secret, password, (err, signer) => {
      if (err) {
        return navForward(newAccountType, {
          error: err
        })
      }

      link.send('nav:back', 'dash', 4)
      link.send(`nav:forward`, 'dash', {
        view: 'expandedSigner',
        data: { signer: signer.id }
      })
    })

  return <PasswordInput {...{ getError, secret, nextStep, title, buttonText }} />
}

function Error({ err }) {
  return (
    <div style={{ textAlign: 'center', width: '100%' }} className='addAccountItemOptionSetupFrame'>
      <>
        <div className='addAccountItemOptionTitle'>{err}</div>
        <div
          role='button'
          className='addAccountItemOptionSubmit'
          onClick={() => link.send('nav:back', 'dash', 3)}
        >
          try again
        </div>
      </>
    </div>
  )
}

export function AddHotAccount({
  title,
  summary,
  svgName,
  intro,
  accountData,
  createSignerMethod,
  newAccountType,
  isValidSecret
}) {
  const getCurrentView = ({ secret, password, err }) => {
    if (err) return <Error {...{ err }} />
    if (!secret) return <EnterSecret {...{ isValidSecret, title, newAccountType }} />
    if (!password) return <CreatePassword {...{ secret, newAccountType }} />
    return <ConfirmPassword {...{ secret, password, newAccountType, createSignerMethod }} />
  }

  return (
    <AddHotAccountWrapper
      {...{
        title,
        intro,
        summary,
        svgName
      }}
    >
      {getCurrentView({ ...accountData, createSignerMethod, newAccountType })}
    </AddHotAccountWrapper>
  )
}
