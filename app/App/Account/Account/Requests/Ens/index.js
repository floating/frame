import React from 'react'

function formatDuration (duration) {
  if (duration < 60) return '< 1 minute'
  if (duration < 3600) return `${Math.floor(duration / 60)} minutes`
  if (duration < (3600 * 24)) return `${Math.floor(duration / 3600)} hours`
  if (duration < (3600 * 24 * 7)) return `${Math.floor(duration / (3600 * 24))} days`
  if (duration < (3600 * 24 * 30)) return `${Math.floor(duration / (3600 * 24 * 7))} weeks`
  if (duration < (3600 * 24 * 365)) return `${Math.floor(duration / (3600 * 24 * 30))} months`
  return `${Math.floor(duration / (3600 * 24 * 365))} years`
}

const EnsOverview = ({ type, data }) => {
  console.log({ type, data })
  
  if (type === 'register') {
    return (
      <>
        <div className='_txDescriptionSummaryLine'>Registering ENS Name</div>
        <div className='_txDescriptionSummaryLine _txDescriptionSummaryHeadline'>{data.name}</div>
        <div className='_txDescriptionSummaryLine'>{`for ${formatDuration(data.duration)}`}</div>
      </>
    )
  }

  if (type === 'renew') {
    return (
      <>
        <div className='_txDescriptionSummaryLine'>Renewing ENS Name</div>
        <div className='_txDescriptionSummaryLine _txDescriptionSummaryHeadline'>{data.name}</div>
        <div className='_txDescriptionSummaryLine'>{`for ${formatDuration(data.duration)}`}</div>
      </>
    )
  }
}

export default EnsOverview
