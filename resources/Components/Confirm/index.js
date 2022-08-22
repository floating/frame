import React, { useState } from 'react'

export default function ConfirmDialog ({ id, prompt, acceptText = 'OK', declineText = 'Decline', onAccept, onDecline }) {
  const [submitted, setSubmitted] = useState(false)

  const clickHandler = (evt, onClick) => {
    if (evt.button === 0 && !submitted) {
      setSubmitted(true)
      onClick()
    }
  }

  const ResponseButton = ({ text, onClick }) => {
    return (
      <div role='button' className='confirmButton' onClick={(evt) => clickHandler(evt, onClick)}>
        {text}
      </div>
    )
  }

  return (
    <div id={id} className='confirmDialog'>
      <div className='confirmText'>{prompt}</div>

      <div className='confirmButtonOptions'>
        <ResponseButton text={declineText} onClick={onDecline} />
        <ResponseButton text={acceptText} onClick={onAccept} />
      </div>
    </div>
  )
}
