import React, { useState } from 'react'
import { Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

const HighValueWarning = ({ updated }) => {
  const [showMessage, setShowMessage] = useState(false)
  return (
    <Cluster>
      <ClusterRow>
        <ClusterValue onClick={() => setShowMessage(!showMessage)}>
          <div className='signerBalanceWarning' style={!updated ? { opacity: 0 } : { opacity: 1 }}>
            <div className='signerBalanceWarningTitle'>{'high value account is using hot signer'}</div>
            {showMessage ? (
              <div className='signerBalanceWarningMessage'>
                {
                  'We recommend using one of our supported hardware signers to increase the security of your account'
                }
              </div>
            ) : null}
          </div>
        </ClusterValue>
      </ClusterRow>
    </Cluster>
  )
}

export default HighValueWarning
