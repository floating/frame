import React from 'react'
import Restore from 'react-restore'

class Settings extends React.Component {
  appInfo () {
    return (
      <React.Fragment>
        <div className='localSettingsTitle'>{'App Info'}</div>
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
    return (
      <div className={this.store('panel.view') !== 'settings' ? 'localSettings localSettingsHidden' : 'localSettings'}>
        <div className='localSettingsTitle'>{'Local Settings'}</div>
        <div className='signerPermission' onClick={_ => this.store.toggleLaunch()}>
          <div className='signerPermissionOrigin'>{'Run on Startup'}</div>
          <div className={this.store('local.launch') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'}>
            <div className='signerPermissionToggleSwitch' />
          </div>
        </div>
        {this.appInfo()}
      </div>
    )
  }
}

export default Restore.connect(Settings)

// <div className='signerPermission' onClick={_ => this.store.runLocalNode()}>
//   <div className='signerPermissionOrigin'>{'Run Local Node'}</div>
//   <div className={this.store('local.node.run') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'}>
//     <div className='signerPermissionToggleSwitch' />
//   </div>
// </div>
