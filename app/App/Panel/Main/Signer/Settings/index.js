import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../link'

class Settings extends React.Component {
  renderVerify (viewIndex) {
    let i = 1
    let transform = viewIndex === i ? 'translateX(0)' : viewIndex > i ? 'translateX(-100%)' : 'translateX(100%)'
    return (
      <div className='signerSlide' style={{ transform }}>
        <div className='signerSettingsTitle'>{'Verify Address'}</div>
        <div className='signerPermission'>
          <div className='signerVerifyText'>{'Verify that the address you see in Frame is the same on your device. This is useful to check before you send to this address to verify it matches the one your device controls.'}</div>
        </div>
        <div className='quitFrame'>
          <div onMouseDown={() => link.send('tray:verifyAddress')} className='quitFrameButton'>{'Verify Address on Device'}</div>
        </div>
      </div>
    )
  }
  renderPermissions (viewIndex) {
    let i = 0
    let transform = viewIndex === i ? 'translateX(0)' : viewIndex > i ? 'translateX(-100%)' : 'translateX(100%)'
    let index = this.store('signers', this.props.id, 'index')
    let account = this.store('signers', this.props.id, 'accounts', index)
    let permissions = this.store('main.accounts', account, 'permissions') || {}
    return (
      <div className='signerSlide' style={{ transform }}>
        <div className='signerSettingsTitle'>{'Dapp Permissions'}</div>
        {Object.keys(permissions).length === 0 ? (
          <div className='signerPermission'>
            <div className='signerPermissionOrigin'>{'No Permissions Set'}</div>
          </div>
        ) : (
          Object.keys(permissions).sort((a, b) => a.origin < b.origin ? -1 : 1).map(o => {
            return (
              <div className='signerPermission' key={o} onMouseDown={_ => link.send('tray:action', 'toggleAccess', account, o)}>
                <div className='signerPermissionOrigin'>{permissions[o].origin}</div>
                <div className={permissions[o].provider ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'}>
                  <div className='signerPermissionToggleSwitch' />
                </div>
              </div>
            )
          })
        )}
        <div className='quitFrame'>
          <div onMouseDown={() => link.send('tray:action', 'clearPermissions', account)} className='quitFrameButton'>{'Clear All Permissions'}</div>
        </div>
      </div>
    )
  }
  render () {
    let viewIndex = this.store('signer.settings.viewIndex')
    return (
      <div className={this.store('signer.view') === 'settings' ? 'signerSettings' : 'signerSettings signerSettingsHidden'}>
        {this.renderPermissions(viewIndex)}
        {this.renderVerify(viewIndex)}
      </div>
    )
  }
}

export default Restore.connect(Settings)
