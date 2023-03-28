import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../resources/link'
import RingIcon from '../../../../../resources/Components/RingIcon'

import Signer from '../../../Signer'

class AddHardware extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {}
    this.deviceName = this.props.type // .replace(/\b\w/g, l => l.toUpperCase())
  }

  render() {
    const signers = this.store('main.signers')
    const isType = (id) => this.store('main.signers', id, 'type') === this.props.type
    const toDevice = (id) => this.store('main.signers', id)

    const tethered = Object.keys(signers).filter(isType.bind(this)).map(toDevice.bind(this))
    return (
      <div className='addAccountItem addAccountItemAdding'>
        <div className='addAccountItemBar addAccountItemHardware' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemTopType'>
              <div className='addAccountItemIcon'>
                {this.props.type === 'ledger' ? (
                  <RingIcon svgName={'ledger'} svgSize={15} />
                ) : (
                  <RingIcon svgName={'trezor'} svgSize={15} />
                )}
                <div className='addAccountItemIconHex addAccountItemIconHexHardware' />
              </div>
              <div className='addAccountItemTopTitle'>{this.deviceName}</div>
            </div>
            {/* <div className='addAccountItemClose' onMouseDown={() => this.props.close()}>{'DONE'}</div> */}
            <div className='addAccountItemSummary'>{`Unlock your ${this.deviceName} to get started`}</div>
          </div>
          <div className='addAccountItemDevices'>
            {tethered.length ? (
              tethered.map((signer, i) => {
                return (
                  <div key={i + signer.id} className='addAccountItemOptionSetupFrame'>
                    {signer ? (
                      <Signer {...signer} inSetup={true} />
                    ) : (
                      <>
                        <div className='addAccountItemOptionTitle'>{this.state.status}</div>
                        {this.state.error ? (
                          <div className='addAccountItemOptionSubmit' onMouseDown={() => this.restart()}>
                            try again
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                )
              })
            ) : (
              <>
                <div className='addAccountItemDevice'>
                  <div className='addAccountItemDeviceTitle'>No Devices Found</div>
                </div>
                {this.deviceName === 'trezor' ? (
                  <div className='addAccountItemTrezorBridgeWarning'>
                    <div>Don&apos;t see your Trezor?</div>
                    <div>
                      <span>Make sure you&apos;ve installed </span>
                      <span
                        className='openBridgeUrl'
                        onClick={() => link.send('tray:openExternal', 'https://wiki.trezor.io/Trezor_Bridge')}
                      >
                        Trezor bridge
                      </span>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
          <div
            className='addAccountItemFooter'
            onClick={() => {
              const open = (url) => link.send('tray:openExternal', url)
              if (this.deviceName === 'ledger')
                return open('https://shop.ledger.com/pages/ledger-nano-x?r=1fb484cde64f')
              if (this.deviceName === 'trezor') return open('https://shop.trezor.io/?offer_id=10&aff_id=3270')
            }}
          >
            {``}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(AddHardware)
