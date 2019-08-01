import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../svg'

class Pending extends React.Component {
  // constructor (...args) {
  //   super(...args)
  // }
  render () {
    // let current = (this.store('selected.current') === this.props.id) && this.props.status === 'ok'
    const open = this.store('selected.open')
    const style = {}
    if (open) {
      style.opacity = 0
      style.pointerEvents = 'none'
      style.transform = 'translate(0px, -100px)'
    }
    style.transition = '0.48s cubic-bezier(.82,0,.12,1) all'
    return (
      <div className='pendingSignerWrap' style={style}>
        <div className='pendingSignerInset'>
          <div className='pendingSignerLogo'>
            {this.props.type === 'ledger' ? <div style={{ marginTop: '4px' }}>{svg.ledger(25)}</div> : svg.trezor(25)}
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
