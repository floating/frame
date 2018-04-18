import React from 'react'
import Restore from 'react-restore'

import provider from '../../../../../provider'

class Settings extends React.Component {
  appInfo () {
    return (
      <React.Fragment>
        <div className='signerSettingsTitle'>{'App Info'}</div>
        <div className='appInfo'>
          <div className='appInfoLine'>
            <div>{'Frame'}</div>
            <div>{'v' + process.env.npm_package_version}</div>
          </div>
          <div className='appInfoLine'>
            <div>{'Electron'}</div>
            <div>{'v' + process.versions.electron}</div>
          </div>
          <div className='appInfoLine'>
            <div>{'Chrome'}</div>
            <div>{'v' + process.versions.chrome}</div>
          </div>
          <div className='appInfoLine'>
            <div>{'Node'}</div>
            <div>{'v' + process.versions.node}</div>
          </div>
        </div>
      </React.Fragment>
    )
  }
  render () {
    let permissions = this.store('local.accounts', this.store('signer.accounts', 0), 'permissions') || {}
    return (
      <div className='signerSettings'>
        <div className='signerSettingsTitle'>{'Ethereum Node'}</div>
        <div className='signerPermission'>
          <div>{provider.url}</div>
        </div>
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
        {this.appInfo()}
      </div>
    )
  }
}

export default Restore.connect(Settings)
