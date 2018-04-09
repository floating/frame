import React from 'react'
import Restore from 'react-restore'
// import octicons from 'octicons'
// import rpc from '../../../../../rpc'
// web3.eth.net.getNetworkType(cb)

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
    console.log(permissions)
    return (
      <div className='signerSettings'>
        <div className='signerSettingsTitle'>{'Ethereum Node'}</div>
        <div className='appInfo'>
          <div className='appInfoLine'>
            <div>{'Rinkby via Infura'}</div>
            <div>{'Connected'}</div>
          </div>
        </div>
        <div className='signerSettingsTitle'>{'Dapp Permissions'}</div>
        {Object.keys(permissions).length === 0 ? (
          <div className='signerPermission'>
            <div className='signerPermissionOrigin'>{'No Permissions Set'}</div>
          </div>
        ) : (
          Object.keys(permissions).sort((a, b) => a.origin < b.origin ? -1 : 1).map(o => {
            console.log('permissions')
            console.log(permissions)
            console.log(o)
            console.log(permissions[o].origin)
            return (
              <div className='signerPermission' key={o.handlerId} onClick={_ => this.store.toggleAccess(o)}>
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
