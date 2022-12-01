import React from 'react'
import Restore from 'react-restore'

// import Account from './Account'
// import TxBar from './TxBar'
// import TxConfirmations from './TxConfirmations'

// import svg from '../../../resources/svg'
// import link from '../../../resources/link'

// import { usesBaseFee } from '../../../resources/domain/transaction'

// const FEE_WARNING_THRESHOLD_USD = 50

class Time extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      time: Date.now(),
    }
    setInterval(() => {
      this.setState({ time: Date.now() })
    }, 1000)
  }

  msToTime(duration) {
    const seconds = Math.floor((duration / 1000) % 60)
    const minutes = Math.floor((duration / (1000 * 60)) % 60)
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
    let label = ''
    let time = ''
    if (hours) {
      label = hours === 1 ? 'hour ago' : 'hours ago'
      time = hours
    } else if (minutes) {
      label = minutes === 1 ? 'minute ago' : 'minutes ago'
      time = minutes
    } else {
      label = 'seconds ago'
      time = seconds
    }
    return { time, label }
  }

  render() {
    const { time, label } = this.msToTime(this.state.time - this.props.time)
    return (
      <div className='txProgressSuccessItem txProgressSuccessItemRight'>
        <div className='txProgressSuccessItemValue'>{time}</div>
        <div className='txProgressSuccessItemLabel'>{label}</div>
      </div>
    )
  }
}

export default Restore.connect(Time)
