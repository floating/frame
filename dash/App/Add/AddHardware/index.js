import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../resources/svg'

import Signer from '../../Signer'

class AddHardware extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {}
    this.deviceName = this.props.type // .replace(/\b\w/g, l => l.toUpperCase())
  }

  render () {
    const accounts = this.store('main.accounts')
    const signers = this.store('main.signers')
    const isType = id => this.store('main.signers', id, 'type') === this.props.type
    const toDevice = id => this.store('main.signers', id)

    const tethered = Object.keys(signers).filter(isType.bind(this)).map(toDevice.bind(this))
    return (
      <div className='addAccountItem addAccountItemAdding'>
        <div className='addAccountItemBar addAccountItemHardware' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemTopType'>
              <div className='addAccountItemIcon'>
                {this.props.type === 'ledger' ? (
                  <div className='addAccountItemIconType addAccountItemIconLedger'>{svg.ledger(17)}</div>
                ) : (
                  <div className='addAccountItemIconType addAccountItemIconTrezor'>{svg.trezor(17)}</div>
                )}
                <div className='addAccountItemIconHex addAccountItemIconHexHardware' />
              </div>
              <div className='addAccountItemTopTitle'>{this.deviceName}</div>
            </div>
            <div className='addAccountItemClose' onMouseDown={() => this.props.close()}>{'DONE'}</div>
            <div className='addAccountItemSummary'>{`Unlock your ${this.deviceName} to get started`}</div>
          </div>
          <div className='addAccountItemDevices'>
            {tethered.length ? (
              tethered.map((signer, i) => {
                return (
                  <div className='addAccountItemOptionSetupFrame'>
                    {signer ? <Signer key={signer.id} {...signer} />
                    : (
                      <>
                        <div className='addAccountItemOptionTitle'>{this.state.status}</div>
                        {this.state.error ? <div className='addAccountItemOptionSubmit' onMouseDown={() => this.restart()}>try again</div> : null}
                      </>
                    )} 
                  </div>
                )
              })
            ) : (
              <div className='addAccountItemDevice'>
                <div className='addAccountItemDeviceTitle'>
                  No Devices Found
                </div>
              </div>
            )}
          </div>
          <div
            className='addAccountItemFooter' onMouseDown={() => {
              const open = url => this.store.notify('openExternal', { url })
              if (this.deviceName === 'ledger') return open('https://shop.ledger.com/pages/ledger-nano-x?r=1fb484cde64f')
              if (this.deviceName === 'trezor') return open('https://shop.trezor.io/?offer_id=10&aff_id=3270')
            }}
          >{``}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(AddHardware)
