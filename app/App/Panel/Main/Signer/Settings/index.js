import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../../resources/link'

import RenameAccount from './RenameAccount'

class Settings extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      verifyAddressSuccess: false,
      verifyAddressResponse: ''
    }
  }

  verifyAddress () {
    link.rpc('verifyAddress', (err, res) => {
      if (err) {
        this.setState({ verifyAddressSuccess: false, verifyAddressResponse: err })
      } else {
        this.setState({ verifyAddressSuccess: true, verifyAddressResponse: 'Address matched!' })
      }
      setTimeout(() => {
        this.setState({ verifyAddressSuccess: false, verifyAddressResponse: '' })
      }, 5000)
    })
  }

  renderRename (viewIndex, subIndex) {
    const i = 3
    const transform = viewIndex === i ? 'translateX(0)' : viewIndex > i ? 'translateX(-100%)' : 'translateX(200%)'
    return (
      <div className='signerSlide' style={{ transform }}>
        <div className='signerSettingsTitle'>Rename Account</div>
        <RenameAccount onClose={() => this.store.setSettingsView(2)} />
      </div>
    )
  }

  renderControl (viewIndex, subIndex) {
    const i = 2
    const transform = viewIndex === i ? 'translateX(0)' : viewIndex > i ? 'translateX(-100%)' : 'translateX(200%)'
    const subTransform = `translateX(-${subIndex * 10}%)`
    // onMouseDown={() => link.send('tray:removeAccount', this.props.id)}
    // onMouseDown={() => link.send('tray:removeSigner', this.props.id)}
    return (
      <div className='signerSlide' style={{ transform }}>
        <div className='signerSettingsTitle'>Account Settings</div>
        <div className='signerSubslide'>
          <div className='signerSubslider' style={{ transform: subTransform }}>
            <div className='signerSubsliderSlide'>
              <div className='quitFrame'>
                <div onMouseDown={() => this.store.setSettingsView(i, 1)} className='quitFrameButton'>Rename account</div>
                <br />
                <div onMouseDown={() => this.store.setSettingsView(i, 2)} className='quitFrameButton'>Remove Account and Signer</div>
                <br />
                <div onMouseDown={() => this.store.setSettingsView(i, 3)} className='quitFrameButton'>Remove Signer Only</div>
              </div>
            </div>
            <div className='signerSubsliderSlide'>
              <RenameAccount onClose={() => this.store.setSettingsView(i, 0)} />
            </div>
            <div className='signerSubsliderSlide' onMouseDown={() => this.store.setSettingsView(i, 0)}>
              <div className='signerSubsliderSlideMessage'>{'Are you sure you want to remove all records of this account and this account\'s signer?'}</div>
              <div className='renameAccountButtonWrap'>
                <div className='renameAccountButton'>Cancel</div>
                <div className='renameAccountButton' onMouseDown={() => link.send('tray:removeAccount', this.props.id)}>Yes</div>
              </div>
            </div>
            <div className='signerSubsliderSlide' onMouseDown={() => this.store.setSettingsView(i, 0)}>
              <div className='signerSubsliderSlideMessage'>{'Are you sure you want to remove all records of this account\'s signer?'}</div>
              <div className='renameAccountButtonWrap'>
                <div className='renameAccountButton'>Cancel</div>
                <div className='renameAccountButton' onMouseDown={() => link.send('tray:removeSigner', this.props.id)}>Yes</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    )
  }

  renderVerify (viewIndex, subIndex) {
    const i = 1
    const transform = viewIndex === i ? 'translateX(0)' : viewIndex > i ? 'translateX(-100%)' : 'translateX(100%)'
    const signerType = this.store('main.accounts', this.props.id, 'signer.type')
    const signerKind = (signerType === 'seed' || signerType === 'ring') ? 'hot' : 'device'
    return (
      <div className='signerSlide' style={{ transform }}>
        <div className='signerSettingsTitle'>Verify Address</div>
        <div className='signerPermission'>
          <div className='signerVerifyText'>Verify that the address displayed in Frame is correct</div>
          {this.state.verifyAddressResponse ? (
            <div className={this.state.verifyAddressSuccess ? 'signerVerifyResponse signerVerifyResponseSuccess' : 'signerVerifyResponse'}>{this.state.verifyAddressResponse}</div>
          ) : null}
        </div>
        <div className='quitFrame'>
          <div onMouseDown={() => this.verifyAddress()} className='quitFrameButton'>{signerKind === 'hot' ? 'Verify Address' : 'Verify Address on Device'}</div>
        </div>
      </div>
    )
  }

  renderPermissions (viewIndex, subIndex) {
    const i = 0
    const transform = viewIndex === i ? 'translateX(0)' : viewIndex > i ? 'translateX(-100%)' : 'translateX(100%)'
    const id = this.store('selected.current')
    const currentIndex = this.store('main.accounts', id, 'index')
    const address = this.store('main.accounts', this.props.id, 'addresses', currentIndex)
    const permissions = this.store('main.addresses', address, 'permissions') || {}
    return (
      <div className='signerSlide' style={{ transform }}>
        <div className='signerSettingsTitle'>Dapp Permissions</div>
        {Object.keys(permissions).length === 0 ? (
          <div className='signerPermission'>
            <div className='signerPermissionControls'>
              <div className='signerPermissionOrigin'>No Permissions Set</div>
            </div>
          </div>
        ) : (
          Object.keys(permissions).sort((a, b) => a.origin < b.origin ? -1 : 1).map(o => {
            return (
              <div className='signerPermission' key={o} onMouseDown={_ => link.send('tray:action', 'toggleAccess', address, o)}>
                <div className='signerPermissionControls'>
                  <div className='signerPermissionOrigin'>{permissions[o].origin}</div>
                  <div className={permissions[o].provider ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'}>
                    <div className='signerPermissionToggleSwitch' />
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div className='quitFrame'>
          <div onMouseDown={() => link.send('tray:action', 'clearPermissions', address)} className='quitFrameButton'>Clear All Permissions</div>
        </div>
      </div>
    )
  }

  render () {
    const viewIndex = this.store('selected.settings.viewIndex')
    const subIndex = this.store('selected.settings.subIndex')
    return (
      <div className={this.store('selected.view') === 'settings' ? 'signerSettings' : 'signerSettings signerSettingsHidden'}>
        {this.renderPermissions(viewIndex, subIndex)}
        {this.renderVerify(viewIndex, subIndex)}
        {this.renderControl(viewIndex, subIndex)}
      </div>
    )
  }
}

export default Restore.connect(Settings)
