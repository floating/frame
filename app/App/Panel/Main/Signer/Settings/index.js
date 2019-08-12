import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../link'

import RenameAccount from './RenameAccount'

class Settings extends React.Component {
  state = {
    showRenameAccount: true
  }

  renderControl (viewIndex) {
    const i = 2
    const transform = viewIndex === i ? 'translateX(0)' : viewIndex > i ? 'translateX(-100%)' : 'translateX(200%)'
    return (
      <div className='signerSlide' style={{ transform }}>
        <div className='signerSettingsTitle'>{ this.state.showRenameAccount ? 'Rename Account' : 'Account Settings'}</div>
        { this.state.showRenameAccount
          ? <RenameAccount />
          : <div className='quitFrame'>
            <div onMouseDown={() => link.send('tray:removeAccount', this.props.id)} className='quitFrameButton'>{'Remove Account and Signer'}</div>
            <br />
            <div onMouseDown={() => link.send('tray:removeSigner', this.props.id)} className='quitFrameButton'>{'Remove Signer Only'}</div>
          </div>
        }
      </div>
    )
  }

  renderVerify (viewIndex) {
    const i = 1
    const transform = viewIndex === i ? 'translateX(0)' : viewIndex > i ? 'translateX(-100%)' : 'translateX(100%)'
    return (
      <div className='signerSlide' style={{ transform }}>
        <div className='signerSettingsTitle'>{'Verify Address'}</div>
        <div className='signerPermission'>
          <div className='signerVerifyText'>{'Verify that the address displayed in Frame is the same on your device.'}</div>
        </div>
        <div className='quitFrame'>
          <div onMouseDown={() => link.send('tray:verifyAddress')} className='quitFrameButton'>{'Verify Address on Device'}</div>
        </div>
      </div>
    )
  }

  renderPermissions (viewIndex) {
    const i = 0
    const transform = viewIndex === i ? 'translateX(0)' : viewIndex > i ? 'translateX(-100%)' : 'translateX(100%)'
    const id = this.store('selected.current')
    const currentIndex = this.store('main.accounts', id, 'index')
    const address = this.store('main.accounts', this.props.id, 'addresses', currentIndex)
    const permissions = this.store('main.addresses', address, 'permissions') || {}
    return (
      <div className='signerSlide' style={{ transform }}>
        <div className='signerSettingsTitle'>{'Dapp Permissions'}</div>
        {Object.keys(permissions).length === 0 ? (
          <div className='signerPermission'>
            <div className='signerPermissionControls'>
              <div className='signerPermissionOrigin'>{'No Permissions Set'}</div>
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
          <div onMouseDown={() => link.send('tray:action', 'clearPermissions', address)} className='quitFrameButton'>{'Clear All Permissions'}</div>
        </div>
      </div>
    )
  }

  render () {
    const viewIndex = this.store('selected.settings.viewIndex')
    return (
      <div className={this.store('selected.view') === 'settings' ? 'signerSettings' : 'signerSettings signerSettingsHidden'}>
        {this.renderPermissions(viewIndex)}
        {this.renderVerify(viewIndex)}
        {this.renderControl(viewIndex)}
      </div>
    )
  }
}

export default Restore.connect(Settings)
