import { useState } from 'react'

import useFocusableRef from '../../../../../resources/Hooks/useFocusableRef'
import RingIcon from '../../../../../resources/Components/RingIcon'
import { ConfirmPassword, CreatePassword } from '../../../../../resources/Components/Password'
import link from '../../../../../resources/link'
import { debounce } from '../../../../../resources/utils'
import { SimpleFlowScreen } from '../../../../../resources/Components/SimpleFlowScreen'

const navForward = async (newAccountType, accountData) =>
  link.send('nav:forward', 'dash', {
    view: 'accounts',
    data: {
      showAddAccounts: true,
      newAccountType,
      accountData
    }
  })

const AddHotAccountWrapper = ({ children, title, svgName, summary, index }) => {
  return (
    <div className={'addAccountItem addAccountItemSmart addAccountItemAdding'}>
      <div className='addAccountItemBar addAccountItemHot' />
      <div className='addAccountItemWrap'>
        <div className='addAccountItemTop'>
          <div className='addAccountItemTopType'>
            <div className='addAccountItemIcon'>
              <div className='addAccountItemIconType addAccountItemIconHot'>
                <RingIcon svgName={svgName} />
              </div>
              <div className='addAccountItemIconHex addAccountItemIconHexHot' />
            </div>
            <div className='addAccountItemTopTitle'>{title}</div>
          </div>
          <div className='addAccountItemSummary'>{summary}</div>
        </div>
        <div className='addAccountItemOption'>
          <div className='addAccountItemOptionSetup' style={{ transform: `translateX(-${100 * index}%)` }}>
            <div className='addAccountItemOptionSetupFrames'>{children}</div>
          </div>
        </div>
        <div className='addAccountItemFooter' />
      </div>
    </div>
  )
}

const EnterSecret = ({ newAccountType, validateSecret, title, autofocus }) => {
  const EMPTY_STATE = `Enter ${title}`
  const inputRef = useFocusableRef(autofocus, 100)
  const [error, setError] = useState(EMPTY_STATE)
  const resetError = () => setError(EMPTY_STATE)

  const clear = () => {
    resetError()
    inputRef.current && (inputRef.current.value = '')
  }

  const validateInput = debounce((e) => {
    const value = removeLineBreaks(e.target.value)
    if (!value) return resetError()
    const validationErr = validateSecret(value)
    setError(validationErr || '')
  }, 300)

  const handleSubmit = () => {
    setTimeout(clear, 2000)
    return navForward(newAccountType, {
      secret: inputRef.current.value
    })
  }

  return (
    <div className='addAccountItemOptionSetupFrame'>
      <div role={'heading'} className='addAccountItemOptionTitle'>
        {title}
      </div>
      <div className='addAccountItemOptionInput phrase'>
        <textarea
          ref={inputRef}
          tabIndex='-1'
          onChange={(e) => {
            inputRef.current.value = removeLineBreaks(e.target.value)
            validateInput(e)
          }}
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
          {'Next'}
        </div>
      )}
    </div>
  )
}

const Error = ({ error }) => {
  return (
    <div className='addAccountItemOptionSetupFrame'>
      <>
        <div className='addAccountItemOptionTitle'>{error}</div>
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

const SeedPhraseTextarea = ({ onChange, onKeyDown }) => (
  <textarea tabIndex='-1' ref={ref} onChange={onChange} onKeyDown={onKeyDown} />
)

export function AddHotAccount({
  title,
  summary,
  svgName,
  intro,
  accountData,
  createSignerMethod,
  newAccountType,
  validateSecret = () => {},
  firstStep,
  backSteps = 4
}) {
  const { secret, password, error, creationArgs = [] } = accountData
  const viewIndex = error ? 3 : !secret ? 0 : !password ? 1 : 2

  const onCreate = (password) => {
    navForward(newAccountType, {
      secret,
      password,
      creationArgs
    })
  }

  const onConfirm = () =>
    link.rpc(createSignerMethod, secret, password, ...creationArgs, (err, signer) => {
      if (err) {
        return navForward(newAccountType, {
          error: err
        })
      }
      link.send('nav:back', 'dash', backSteps)
      link.send(`nav:forward`, 'dash', {
        view: 'expandedSigner',
        data: { signer: signer.id }
      })
    })

  // TODO: autofocus (on step 1 and also back steps)
  // abstract
  // get rid of nested ternaries
  // ensure 'error' message on first render / back steps
  // check keystore password on first step
  // Don’t require re-entry of seed phrase after invalid password entered
  // Able to unhide values by clicking a button

  const steps = [
    firstStep || (
      <SimpleFlowScreen
        autofocus={viewIndex === 0}
        inputField={SeedPhraseTextarea}
        valueParser={removeLineBreaks}
        next={(value) => {
          setTimeout(clear, 2000)
          return navForward(newAccountType, {
            secret: value
          })
        }}
      />
    ),
    <CreatePassword key={1} onCreate={onCreate} autofocus={viewIndex === 1} />,
    <ConfirmPassword
      key={2}
      password={password}
      onConfirm={onConfirm}
      autofocus={viewIndex === 2}
      submittedMessage='processing...'
    />,
    <Error key={3} error={error} />
  ]

  return (
    <AddHotAccountWrapper title={title} intro={intro} summary={summary} svgName={svgName} index={viewIndex}>
      {steps}
    </AddHotAccountWrapper>
  )
}
