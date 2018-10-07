import React from 'react'
import Restore from 'react-restore'
// import svg from '../../../svg'

class Notify extends React.Component {
  render () {
    return (
      <div className={this.store('view.showMainnetWarning') ? 'notify notifyOn' : 'notify'} onMouseDown={() => this.store.showMainnetWarning(false)}>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            {'Mainnet Warning'}
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>{'Frame is alpha software, be cautious when using it on the mainnet and verify all transaction details on your signing device.'}</div>
            <div className='notifyBodyLine'>{'Proceeed only if you understand the risks.'}</div>
          </div>
          <div className='notifyInput'>
            <div className='notifyInputOption notifyInputDeny' onMouseDown={() => this.store.showMainnetWarning(false)}>{'Go Back'}</div>
            <div className='notifyInputOption notifyInputApprove' onMouseDown={() => this.store.showMainnetWarning(false).selectNetwork('1').enableMainnet()}>{'Proceed'}</div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Notify)
