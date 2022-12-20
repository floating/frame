import React from 'react'
import { useState } from 'react'

import RingIcon from '../../../../../resources/Components/RingIcon'
import { ConfirmPassword, CreatePassword } from '../../../../../resources/Components/Password'
import link from '../../../../../resources/link'

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
    if (e.type !== 'mousedown' && e.key !== 'Enter') {
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
      <div className='addAccountItemOptionInputPhrase'>
        <textarea
          data-testid='addHotAccountSecretTextEntry'
          autoFocus
          tabIndex='-1'
          value={secret}
          onChange={updateInput}
          onKeyDown={handleSubmit}
        />
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
  const onCreate = (secret) => (password) =>
    navForward(newAccountType, {
      secret,
      password
    })

  const onConfirm = (secret) => (password) =>
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

  const getCurrentView = ({ secret, password, err }) => {
    if (err) return <Error {...{ err }} />
    if (!secret) return <EnterSecret {...{ isValidSecret, title, newAccountType }} />
    if (!password) return <CreatePassword onCreate={onCreate(secret)} />
    return <ConfirmPassword password={password} onConfirm={onConfirm(secret)} />
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
