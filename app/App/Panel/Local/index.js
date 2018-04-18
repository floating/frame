import React from 'react'
import Restore from 'react-restore'

class Settings extends React.Component {
  render () {
    return (
      <div className='localSettings'>
        <div className='localSettingsTitle'>{'Local Settings'}</div>
        <div className='signerPermission' onClick={_ => this.store.toggleLaunch()}>
          <div className='signerPermissionOrigin'>{'Run on Startup'}</div>
          <div className={this.store('local.launch') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'}>
            <div className='signerPermissionToggleSwitch' />
          </div>
        </div>
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
