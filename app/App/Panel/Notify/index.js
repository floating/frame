import React from 'react'
import Restore from 'react-restore'
// import svg from '../../../svg'

class Notify extends React.Component {
  render () {
    return (
      <div className={this.store('view.showMainnetWarning') ? 'notify notifyOn' : 'notify'}>
        <div className='notifyBox'>
          <div className='notifyTitle'>
            {'Mainnet Warning'}
          </div>
          <div className='notifyBody'>
            {'Frame is alpha software not ready for mainnet use. If you proceed, be sure to verify the details of every transacion on your device.'}
          </div>
          <div className='notifyInput'>
            <div className='notifyInputOption notifyInputDeny' onMouseDown={() => this.store.showMainnetWarning(false)}>{'Cancel'}</div>
            <div className='notifyInputOption notifyInputApprove' onMouseDown={() => this.store.showMainnetWarning(false).selectNetwork('1').enableMainnet()}>{'Proceed'}</div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Notify)
