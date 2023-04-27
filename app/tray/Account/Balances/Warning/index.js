import React, { useState } from 'react'

const HighValueWarning = ({ updated }) => {
  const [showMessage, setShowMessage] = useState(true)
  return (
    <div
      className='signerBalanceWarning'
      onClick={() => setShowMessage(!showMessage)}
      style={!updated ? { opacity: 0 } : { opacity: 1 }}
    >
      <div className='signerBalanceWarningTitle'>{'high value account is using hot signer'}</div>
      {showMessage ? (
        <div className='signerBalanceWarningMessage'>
          {
            'We recommend using one of our supported hardware signers to increase the security of your account'
          }
        </div>
      ) : null}
    </div>
  )
}

export default HighValueWarning
