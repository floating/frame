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

  submitPhrase () {
    link.rpc('trezorPhrase', this.props.id, this.state.tPhrase, () => {})
    this.setState({ tPhrase: '' })
  }

  renderLoadingLive () {
    if (this.props.type === 'ledger' && this.props.status.toLowerCase() === 'deriving live addresses') {
      return (
        <div className='loadingLiveAddresses'>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => {
            return <div key={'loadingLiveAddress' + i} className='loadingLiveAddress' style={{ opacity: i <= this.props.liveAddressesFound ? '1' : '0.3' }} />
          })}
        </div>
      )
    } else {
      return null
    }
  }

  renderTrezorPin (active) {
    return (
      <div className='trezorPinWrap' style={active ? {} : { height: '0px', padding: '0px 0px 0px 0px' }}>
        {active ? (
          <>
            <div className='trezorPhraseInput'>
              {this.state.tPin.split('').map((n, i) => {
                return (
                  <div key={i} className='trezorPinInputButton' onMouseDown={this.trezorPin.bind(this, i)}>
                    {svg.octicon('primitive-dot', { height: 14 })}
                  </div>
                )
              })}
            </div>
            <div className='signerPinMessage signerPinSubmit' onMouseDown={this.state.tPin ? () => this.submitPin() : null}>
              Submit Pin
              {this.state.tPin ? (
                <div className='signerPinDelete' onMouseDown={this.backspacePin.bind(this)}>
                {svg.octicon('chevron-left', { height: 18 })}
              </div>
              ) : null}
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
          </>
        ) : null }
      </div>
    )
  }

  renderTrezorPhrase (active) {
    return (
      <div className='trezorPinWrap' style={active ? {} : { height: '0px', padding: '0px 0px 0px 0px' }}>
        {active ? (
          <>
            <div className='trezorPhraseInput'>
              <input type='password' onChange={(e) => this.setState({ tPhrase: e.target.value })} autoFocus />
            </div>
            <div className={'signerPinMessage signerPinSubmit'} onMouseDown={ () => this.submitPhrase() }>
              Submit Passphrase
            </div>
          </>
        ) : null}        
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
    if (this.props.type === 'trezor' && this.props.status === 'Enter Passphrase') style.height = '180px'

    style.transition = '0.48s cubic-bezier(.82,0,.12,1) all'

    const status = this.props.status ? this.props.status.charAt(0).toUpperCase() + this.props.status.substring(1) : ''

    return (
      <div className='pendingSignerWrap' style={style}>
        <div className='pendingSignerInset'>
          <div className='pendingSignerTop'>
            {this.renderLoadingLive()}
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
            {this.renderTrezorPhrase(this.props.type === 'trezor' && this.props.status === 'Enter Passphrase')}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Pending)
