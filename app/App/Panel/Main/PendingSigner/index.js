import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../svg'

class Pending extends React.Component {
  // constructor (...args) {
  //   super(...args)
  // }
  render () {
    return (
      <div className='pendingSignerWrap'>
        <div className='pendingSignerInset'>
          <div className='pendingSignerLogo'>
            {this.props.type === 'ledger' ? svg.ledger(25) : svg.trezor(25)}
          </div>
          <div className='pendingSignerText'>
            <div className='pendingSignerType'>{this.props.type + ' Found'}</div>
            <div className='pendingSignerStatus'>{this.props.status}</div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Pending)
