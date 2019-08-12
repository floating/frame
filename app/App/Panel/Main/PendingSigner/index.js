import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../svg'
import link from '../../../../link'

class Pending extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = { tPin: '' }
  }

  backspacePin (e) {
    e.stopPropagation()
    this.setState({ tPin: this.state.tPin ? this.state.tPin.slice(0, -1) : '' })
  }

  trezorPin (num) {
    this.setState({ tPin: this.state.tPin + num.toString() })
  }

  submitPin () {
    link.rpc('trezorPin', this.props.id, this.state.tPin, () => {})
    this.setState({ tPin: '' })
  }

  renderTrezorPin (active) {
    return (
      <div className='trezorPinWrap' style={active ? {} : { height: '0px', padding: '0px 0px 0px 0px' }}>
        <div className='signerPinDisplay' style={!this.state.tPin ? { opacity: 0, height: '0px', paddingBottom: '0px' } : { opacity: 1, height: '30px', paddingBottom: '0px' }}>
          {this.state.tPin.split('').map((n, i) => {
            return (
              <div key={i} className='trezorPinInputButton' onMouseDown={this.trezorPin.bind(this, i)}>
                {svg.octicon('primitive-dot', { height: 14 })}
              </div>
            )
          })}
        </div>
        <div className={this.state.tPin ? 'signerPinMessage signerPinSubmit' : 'signerPinMessage'} onMouseDown={this.state.tPin ? () => this.submitPin() : null}>
          {this.state.tPin ? 'Submit' : 'Enter Pin'}
          <div className='signerPinDelete' onMouseDown={this.backspacePin.bind(this)}>
            {svg.octicon('chevron-left', { height: 18 })}
          </div>
        </div>
        <div className='trezorPinInputWrap'>
          <div className='trezorPinInput'>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
              <div key={i} className='trezorPinInputButton' onMouseDown={this.trezorPin.bind(this, i)}>
                {svg.octicon('primitive-dot', { height: 20 })}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  render () {
    const open = this.store('selected.open')
    const style = {}
    if (open) {
      style.opacity = 0
      style.pointerEvents = 'none'
      style.transform = 'translate(0px, -100px)'
    }
    if (this.props.type === 'trezor' && this.props.status === 'Need Pin') style.height = '300px'

    style.transition = '0.48s cubic-bezier(.82,0,.12,1) all'

    const status = this.props.status ? this.props.status.charAt(0).toUpperCase() + this.props.status.substring(1) : ''

    return (
      <div className='pendingSignerWrap' style={style}>
        <div className='pendingSignerInset'>
          <div className='pendingSignerTop'>
            <div className='pendingSignerLogo'>
              {this.props.type === 'ledger' ? <div style={{ marginTop: '4px' }}>{svg.ledger(25)}</div> : svg.trezor(25)}
            </div>
            <div className='pendingSignerText'>
              <div className='pendingSignerType'>{this.props.type + ' Found'}</div>
              <div className='pendingSignerStatus'>{status}</div>
            </div>
          </div>
          <div className='signerInterface'>
            {this.renderTrezorPin(this.props.type === 'trezor' && this.props.status === 'Need Pin')}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Pending)
