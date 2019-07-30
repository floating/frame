import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../../svg'

class AddHardware extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {}
    this.deviceName = this.props.type // .replace(/\b\w/g, l => l.toUpperCase())
  }

  render () {
    const accounts = this.store('main.accounts')
    const signers = this.store('main.signers')
    let tethered = Object.keys(signers).filter(id => Object.keys(accounts).indexOf(id) > -1)
    let untethered = Object.keys(signers).filter(id => Object.keys(accounts).indexOf(id) < 0)
    const isType = id => this.store('main.signers', id, 'type') === this.props.type
    const toDevice = id => this.store('main.signers', id)
    tethered = tethered.filter(isType.bind(this)).map(toDevice.bind(this))
    untethered = untethered.filter(isType.bind(this)).map(toDevice.bind(this))
    return (
      <div className='addAccountItem' style={{ transitionDelay: (0.64 * this.props.index / 4) + 's' }}>
        <div className='addAccountItemBar addAccountItemHardware' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemIcon'>
              <div className='addAccountItemIconType addAccountItemIconHardware'>{this.props.type === 'ledger' ? svg.ledger(20) : svg.trezor(16)}</div>
              <div className='addAccountItemIconHex addAccountItemIconHexHardware' />
            </div>
            <div className='addAccountItemTopTitle'>{this.deviceName}</div>
            <div className='addAccountItemTopTitle'>{''}</div>
          </div>
          <div className='addAccountItemSummary'>{`Unlock your ${this.deviceName} to get started`}</div>
          <div className='addAccountItemDevices'>
            {untethered.length || tethered.length ? (
              untethered.map((signer, i) => {
                return (
                  <div className='addAccountItemDevice' key={signer.id}>
                    <div className='addAccountItemDeviceTitle'>{'Device Found'}</div>
                    <div className='addAccountItemDeviceStatus'>{signer.status}</div>
                  </div>
                )
              }).concat(tethered.map((signer, i) => {
                return (
                  <div className='addAccountItemDevice' key={signer.id} onMouseDown={() => this.store.toggleAddAccount()}>
                    <div className='addAccountItemDeviceTitle'>{'Device Found'}</div>
                    <div className='addAccountItemDeviceStatus'>{'Account Created'}</div>
                  </div>
                )
              }))
            ) : (
              <div className='addAccountItemDevice'>
                <div className='addAccountItemDeviceTitle'>
                  {this.deviceName === 'ledger' ? 'No Devices Found' : 'temporarly unsupported'}
                </div>
              </div>
            )}
          </div>
          <div className='addAccountItemSummary'>{`Need a signer? Get a ${this.deviceName}`}</div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(AddHardware)
