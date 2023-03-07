// import { useState } from 'react'
import zxcvbn from 'zxcvbn'

// import useFocusableRef from '../../Hooks/useFocusableRef'
// import { debounce } from '../../utils'
import { SimpleFlowScreen } from '../SimpleFlowScreen'

// const NO_PASSWORD_ENTERED = 'Enter password'

// export const PasswordInput = ({
//   getError: getInputError,
//   next,
//   title,
//   buttonText = '',
//   autofocus,
//   submittedMessage = ''
// }) => {
//   const [error, setError] = useState(NO_PASSWORD_ENTERED)
//   const inputRef = useFocusableRef(autofocus)
//   const [disabled, setDisabled] = useState(false)
//   const [submitted, setSubmitted] = useState(false)

//   const handleSubmit = () => {
//     next(inputRef.current.value)
//     setSubmitted(true)
//     setTimeout(() => {
//       inputRef.current && (inputRef.current.value = '')
//       setError(NO_PASSWORD_ENTERED)
//     }, 2000)
//   }

//   const getError = () =>
//     inputRef.current.value ? getInputError(inputRef.current.value) || '' : NO_PASSWORD_ENTERED

//   const validateInput = (e) => {
//     const err = getError()
//     if (err) {
//       setDisabled(true)
//       return debounce(() => {
//         setDisabled(false)
//         setError(getError())
//       }, 300)()
//     }
//     return setError(err)
//   }

//   const Submit = () => {
//     if (error) {
//       return (
//         <div role='button' className='addAccountItemOptionError'>
//           {error}
//         </div>
//       )
//     }
//     if (submitted) {
//       return <div className='addAccountItemOptionSubmittedMessage'>{submittedMessage}</div>
//     }

//     return (
//       <div role='button' className='addAccountItemOptionSubmit' onClick={() => !disabled && handleSubmit()}>
//         {buttonText}
//       </div>
//     )
//   }

//   return (
//     <div className='addAccountItemOptionSetupFrame'>
//       <div role='heading' className='addAccountItemOptionTitle'>
//         {title}
//       </div>
//       <div className='addAccountItemOptionInput addAccountItemOptionInputPassword'>
//         <input
//           role='textbox'
//           type='password'
//           tabIndex='-1'
//           ref={inputRef}
//           onChange={validateInput}
//           onKeyDown={(e) => {
//             if (!error && e.key === 'Enter' && !disabled) handleSubmit()
//           }}
//         />
//       </div>
//       <Submit
//         error={error}
//         submitted={submitted}
//         submittedMessage={submittedMessage}
//         buttonText={buttonText}
//         disabled={disabled}
//       />
//     </div>
//   )
// }

const PasswordInput = ({ ref, onChange, onKeyDown }) => (
  <input role='textbox' type='password' tabIndex='-1' ref={ref} onChange={onChange} onKeyDown={onKeyDown} />
)

export const CreatePassword = ({ onCreate, autofocus }) => {
  const validateInput = (password) => {
    if (password.length < 12) {
      return {
        valid: false,
        message: 'PASSWORD MUST BE 12 OR MORE CHARACTERS'
      }
    }

    const {
      feedback: { warning },
      score
    } = zxcvbn(password)

    if (score <= 2) {
      return {
        valid: false,
        message: (warning || 'PLEASE ENTER A STRONGER PASSWORD').toUpperCase()
      }
    }

    return { valid: true }
  }

  return (
    <SimpleFlowScreen
      validateInput={validateInput}
      next={onCreate}
      title='Create Password'
      buttonText='Continue'
      autofocus={autofocus}
      emptyFieldMessage='Enter Password'
      inputField={PasswordInput}
    />
  )
}

export const ConfirmPassword = ({ password, onConfirm, autofocus, submittedMessage }) => {
  const validateInput = (confirmedPassword) => {
    if (password !== confirmedPassword) {
      return {
        valid: false,
        message: 'PASSWORDS DO NOT MATCH'
      }
    }

    return { valid: true }
  }

  return (
    <SimpleFlowScreen
      validateInput={validateInput}
      next={onConfirm}
      title='Confirm Password'
      buttonText='Create'
      autofocus={autofocus}
      submittedMessage={submittedMessage}
      emptyFieldMessage='Enter Password'
      inputField={PasswordInput}
    />
  )
}
