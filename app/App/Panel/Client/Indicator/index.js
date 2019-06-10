import React from 'react'

const Indicator = ({ state }) => {
  if (state === 'ready') {
    return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorGood' /></div>
  } else if (state === 'off') {
    return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorBad' /></div>
  } else {
    return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorPending' /></div>
  }
}

export default Indicator
