const timeFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

function formatTime(amount, unit) {
  return `for ${amount} ${unit}${amount > 1 ? 's' : ''}`
}

function formatDuration(duration) {
  if (duration < 60) return 'for < 1 minute'
  if (duration < 3600) return formatTime(Math.floor(duration / 60), 'minute')
  if (duration < 3600 * 24) return formatTime(Math.floor(duration / 3600), 'hour')

  const endDate = new Date()
  endDate.setSeconds(endDate.getSeconds() + duration)

  return `until ${timeFormat.format(endDate)}`
}

const EnsOverview = ({ type, data }) => {
  if (type === 'commit') {
    return (
      <>
        <div className='_txDescriptionSummaryLine'>Submitting ENS Commitment</div>
      </>
    )
  }

  if (type === 'register') {
    return (
      <>
        <div className='_txDescriptionSummaryLine'>Registering ENS Name</div>
        <div className='_txDescriptionSummaryLine _txDescriptionSummaryHeadline'>{data.name}</div>
        <div className='_txDescriptionSummaryLine'>{`${formatDuration(data.duration)}`}</div>
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

  if (type === 'transfer') {
    const { name, tokenId, from, to } = data
    const display = name || tokenId

    return (
      <>
        <div className='_txDescriptionSummaryLine'>{`Transferring ENS Name${
          name ? '' : ' with token id'
        }`}</div>
        <div className='_txDescriptionSummaryLine _txDescriptionSummaryHeadline'>{display}</div>
        <div className='_txDescriptionSummaryLine'>from</div>
        <div className='_txDescriptionSummaryLine _txDescriptionSummaryMidline'>{from}</div>
        <div className='_txDescriptionSummaryLine'>to</div>
        <div className='_txDescriptionSummaryLine _txDescriptionSummaryMidline'>{to}</div>
      </>
    )
  }

  if (type === 'approve') {
    const { operator, name } = data

    return (
      <>
        <div className='_txDescriptionSummaryLine'>Granting approval to</div>
        <div className='_txDescriptionSummaryLine _txDescriptionSummaryMidline'>{operator}</div>
        <div className='_txDescriptionSummaryLine'>as an approved operator for</div>
        <div className='_txDescriptionSummaryLine _txDescriptionSummaryHeadline'>{name}</div>
      </>
    )
  }
}

export default EnsOverview
