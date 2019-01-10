import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../link'

class Settings extends React.Component {
  renderVerify () {
    return (
      <div className='signerSlideVerify'>
        {'hi'}
      </div>
    )
  }
  renderPermissions () {
    let index = this.store('signers', this.props.id, 'index')
    let account = this.store('signers', this.props.id, 'accounts', index)
    let permissions = this.store('main.accounts', account, 'permissions') || {}
    return (
      <div className='signerSlidePermissions'>
        <div className='signerMidMenu' />
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
    return (
      <div className={this.store('signer.view') === 'settings' ? 'signerSettings' : 'signerSettings signerSettingsHidden'}>
        <div className='settingsSlide'>
          {this.renderPermissions()}
          {this.renderVerify()}
        </div>
      </div>
    )
  }
}

export default Restore.connect(Settings)
