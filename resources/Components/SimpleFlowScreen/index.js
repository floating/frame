import { useState } from 'react'

import useFocusableRef from '../../Hooks/useFocusableRef'
import { debounce } from '../../utils'

function removeLineBreaks(str) {
  return str.replace(/(\r\n|\n|\r)/gm, '')
}

export const SimpleFlowScreen = ({
  validateInput,
  next,
  title,
  buttonText = '',
  autofocus,
  submittedMessage = '',
  emptyFieldMessage = '',
  valueParser = (value) => value,
  inputField: Input
}) => {
  const [error, setError] = useState(emptyFieldMessage)
  const inputRef = useFocusableRef(autofocus)
  const [disabled, setDisabled] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    next(inputRef.current.value)
    setSubmitted(true)
    setTimeout(() => {
      inputRef.current && (inputRef.current.value = '')
      setError(emptyFieldMessage)
    }, 2000)
  }

  // const getError = () =>
  //   inputRef.current.value ? getInputError(inputRef.current.value) || '' : emptyFieldMessage

  // const value = removeLineBreaks(e.target.value)
  // if (!value) return resetError()
  // const validationErr = validateSecret(value)
  // setError(validationErr || '')

  const handleChange = (e) => {
    const value = removeLineBreaks(e.target.value)
    const { valid, message } = validateInput(value)
    if (!valid) {
      setDisabled(true)
      return debounce(() => {
        setDisabled(false)
        setError(message)
      }, 300)()
    }
    return setError(emptyFieldMessage)
  }

  const Submit = () => {
    if (error) {
      return (
        <div role='button' className='addAccountItemOptionError'>
          {error}
        </div>
      )
    }
    if (submitted) {
      return <div className='addAccountItemOptionSubmittedMessage'>{submittedMessage}</div>
    }

    return (
      <div role='button' className='addAccountItemOptionSubmit' onClick={() => !disabled && handleSubmit()}>
        {buttonText}
      </div>
    )
  }

  return (
    <div className='addAccountItemOptionSetupFrame'>
      <div role='heading' className='addAccountItemOptionTitle'>
        {title}
      </div>
      <div className='addAccountItemOptionInput addAccountItemOptionInputPassword'>
        <Input
          ref={inputRef}
          onChange={(e) => {
            inputRef.current.value = valueParser(e.target.value)
            handleChange(e)
          }}
          onKeyDown={(e) => {
            if (!error && e.key === 'Enter' && !disabled) handleSubmit()
          }}
        />
      </div>
      <Submit
        error={error}
        submitted={submitted}
        submittedMessage={submittedMessage}
        buttonText={buttonText}
        disabled={disabled}
      />
    </div>
  )
}
