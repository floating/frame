import React from 'react'
import Indicator from '../Indicator'

const Status = ({ client }) => {
  const { state, currentBlock, highestBlock } = client
  const syncPercentage = Math.round((currentBlock / highestBlock) * 100)
  return (
    <div className='connectionOptionStatus'>
      <Indicator state={state} />
      {state === 'syncing' && 
      !isNaN(syncPercentage) ? (
        <div className='connectionOptionStatusText'>{state} ({syncPercentage} %)</div>
      ) : (
        <div className='connectionOptionStatusText'>{state}</div>
      )}
    </div>
  )
}

export default Status
