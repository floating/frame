import React from 'react'
import Restore from 'react-restore'
// import svg from '../../../svg'

class Notify extends React.Component {
  render () {
    return (
      <div className={this.store('view.showMainnetWarning') ? 'notify notifyOn' : 'notify'} onMouseDown={() => this.store.showMainnetWarning(false)}>
        <div className='notifyBoxWrap'>
          <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
            <div className='notifyTitle'>
              {'Mainnet Notice'}
            </div>
            <div className='notifyBody'>
              <div className='notifyBodyLine'>{'Frame is still alpha software, be cautious using it on the mainnet, verify all transactions on your signing device.'}</div>
              <div className='notifyBodyLine'>{'Proceeed only if you understand and accept these risks.'}</div>
            </div>
            <div className='notifyInput'>
              <div className='notifyInputOption notifyInputDeny' onMouseDown={() => this.store.showMainnetWarning(false)}>
                <div className='notifyInputOptionText'>{'Go Back'}</div>
              </div>
              <div className='notifyInputOption notifyInputProceed' onMouseDown={() => {
                this.store.showMainnetWarning(false).enableMainnet()
                setTimeout(() => this.store.selectNetwork('1'), 700)
              }}>
                <div className='notifyInputOptionText'>{'Proceed'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Notify)
