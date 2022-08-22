import React, { useState } from 'react'

import link from '../../../resources/link'

export default function ConfirmDialog ({ id, prompt, acceptText = 'OK', declineText = 'Decline' }) {
  const [submitted, setSubmitted] = useState(false)

  const clickHandler = (evt, response) => {
    if (evt.button === 0 && !submitted) {
      setSubmitted(true)
      link.send('dash:resolveConfirm', id, response)
    }
  }

  const ResponseButton = ({ text, response }) => {
    return (
      <div role='button' className='confirmButton' onClick={(evt) => clickHandler(evt, response)}>
        {text}
      </div>
    )
  }

  return (
    <div id={id} className='confirmDialog'>
      <div className='confirmText'>{prompt}</div>

      <div className='confirmButtonOptions'>
        <ResponseButton text={declineText} response={false} />
        <ResponseButton text={acceptText} response={true} />
      </div>
    </div>
  )
}
