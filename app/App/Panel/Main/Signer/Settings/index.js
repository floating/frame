import React from 'react'
import Restore from 'react-restore'

// import provider from '../../../../../provider'

class Settings extends React.Component {
  clearPermissions () {
    return (
      <div className='quitFrame'>
        <div onClick={() => this.store.clearPermissions()} className='quitFrameButton'>{'Clear All Permissions'}</div>
      </div>
    )
  }
  render () {
    let permissions = this.store('local.accounts', this.store('signer.accounts', 0), 'permissions') || {}
    return (
      <div className={this.store('signer.view') === 'settings' ? 'signerSettings' : 'signerSettings signerSettingsHidden'}>
        <div className='signerSettingsTitle'>{'Dapp Permissions'}</div>
        {Object.keys(permissions).length === 0 ? (
          <div className='signerPermission'>
            <div className='signerPermissionOrigin'>{'No Permissions Set'}</div>
          </div>
        ) : (
          Object.keys(permissions).sort((a, b) => a.origin < b.origin ? -1 : 1).map(o => {
            return (
              <div className='signerPermission' key={o} onClick={_ => this.store.toggleAccess(o)}>
                <div className='signerPermissionOrigin'>{permissions[o].origin}</div>
                <div className={permissions[o].provider ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'}>
                  <div className='signerPermissionToggleSwitch' />
                </div>
              </div>
            )
          })
        )}
        {this.clearPermissions()}
      </div>
    )
  }
}

export default Restore.connect(Settings)
