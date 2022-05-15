import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../../../resources/svg'

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
      <div className='phaseItem' style={{ transitionDelay: (0.64 * this.props.index / 4) + 's' }}>
        <div className='phaseItemBar phaseItemHardware' />
        <div className='phaseItemWrap'>
          <div className='phaseItemTop'>
            <div className='phaseItemIcon'>
              <div className='phaseItemIconType phaseItemIconHardware'>{this.props.type === 'ledger' ? svg.ledger(20) : svg.trezor(16)}</div>
              <div className='phaseItemIconHex phaseItemIconHexHardware' />
            </div>
            <div className='phaseItemTopTitle'>{this.deviceName}</div>
            <div className='phaseItemTopTitle' />
          </div>
          <div className='phaseItemSummary'>{`Unlock your ${this.deviceName} to get started`}</div>
          <div className='phaseItemDevices'>
            {untethered.length || tethered.length ? (
              untethered.map((signer, i) => {
                return (
                  <div className='phaseItemDevice' key={signer.id}>
                    <div className='phaseItemDeviceTitle'>Device Found</div>
                    <div className='phaseItemDeviceStatus'>{signer.status}</div>
                  </div>
                )
              }).concat(tethered.map((signer, i) => {
                return (
                  <div className='phaseItemDevice' key={signer.id} onMouseDown={() => this.store.toggleAddAccount()}>
                    <div className='phaseItemDeviceTitle'>Device Found</div>
                    <div className='phaseItemDeviceStatus'>Account Created</div>
                  </div>
                )
              }))
            ) : (
              <div className='phaseItemDevice'>
                <div className='phaseItemDeviceTitle'>
                  No Devices Found
                </div>
              </div>
            )}
          </div>
          <div
            className='phaseItemSummary' onMouseDown={() => {
              const open = url => this.store.notify('openExternal', { url })
              if (this.deviceName === 'ledger') return open('https://shop.ledger.com/pages/ledger-nano-x?r=1fb484cde64f')
              if (this.deviceName === 'trezor') return open('https://shop.trezor.io/?offer_id=10&aff_id=3270')
            }}
          >{`Need a signer? Get a ${this.deviceName}`}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(AddHardware)
