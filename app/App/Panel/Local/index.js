import React from 'react'
import Restore from 'react-restore'
import { ipcRenderer } from 'electron'

const networks = {1: 'Mainnet', 3: 'Ropsten', 4: 'Rinkeby', 42: 'Kovan'}

class Settings extends React.Component {
  appInfo () {
    return (
      <React.Fragment>
        <div className='localSettingsTitle'>{'Info'}</div>
        <div className='appInfo'>
          <div className='appInfoLine'>
            <div>{'Frame'}</div>
            <div>{'v' + require('../../../../package.json').version}</div>
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
  quit () {
    return (
      <div className='quitFrame'>
        <div onClick={() => ipcRenderer.send('tray:quit')} className='quitFrameButton'>{'Quit'}</div>
      </div>
    )
  }
  indicator (status) {
    if (status === 'connected') {
      return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorGood' /></div>
    } else if (status === 'loading' || status === 'syncing' || status === 'pending' || status === 'standby') {
      return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorPending' /></div>
    } else {
      return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorBad' /></div>
    }
  }
  render () {
    return (
      <div className={this.store('panel.view') !== 'settings' ? 'localSettings localSettingsHidden' : 'localSettings'}>
        <div className='localSettingsTitle connectionTitle'>
          <div>{'Connection'}</div>
          <div className='connectionTitleSet' onClick={() => this.store.selectNetwork('->')}>
            <div>{networks[this.store('local.connection.network')] || 'Unknown, ID: ' + this.store('local.connection.network')}</div>
          </div>
        </div>
        <div className='signerPermission'>
          <div className={this.store('local.connection.local.on') ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
            <div className='connectionOptionToggle'>
              <div className='signerPermissionOrigin'>{'Local'}</div>
              <div className={this.store('local.connection.local.on') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onClick={_ => this.store.toggleConnection('local')}>
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='connectionOptionDetails'>
              <div className='connectionOptionStatus'>
                {this.indicator(this.store('local.connection.local.status'))}
                <div className='connectionOptionStatusText'>{this.store('local.connection.local.status')}</div>
              </div>
              <div className='signerOptionSet'>
                <div className='signerOptionSetBadge'>{'Geth'}</div>
              </div>
            </div>
          </div>
        </div>
        <div className='signerPermission'>
          <div className={this.store('local.connection.secondary.on') ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
            <div className='connectionOptionToggle'>
              <div className='signerPermissionOrigin'>{'Secondary'}</div>
              <div className={this.store('local.connection.secondary.on') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onClick={_ => this.store.toggleConnection('secondary')}>
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='connectionOptionDetails'>
              <div className='connectionOptionStatus'>
                {this.indicator(this.store('local.connection.secondary.status'))}
                <div className='connectionOptionStatusText'>{this.store('local.connection.secondary.status')}</div>
              </div>
              <div className='signerOptionSet'>
                <div className='signerOptionSetBadge'>{'Infura'}</div>
              </div>
            </div>
          </div>
        </div>
        <div className='localSettingsTitle'>{'Settings'}</div>
        <div className='signerPermission'>
          <div className='signerPermissionOrigin'>{'Run Frame on Startup'}</div>
          <div className={this.store('local.launch') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onClick={_ => this.store.toggleLaunch()}>
            <div className='signerPermissionToggleSwitch' />
          </div>
        </div>
        {this.appInfo()}
        {this.quit()}
      </div>
    )
  }
}

export default Restore.connect(Settings)

// <div className='signerPermission'>
//   <div>{provider.url}</div>
//   <div className={this.store('node.provider') ? 'nodeProviderStatus nodeProviderConnected' : 'nodeProviderStatus'}>
//     {this.store('node.provider') ? 'connected' : 'disconnected'}
//   </div>
// </div>

// <div className='signerPermission' onClick={_ => this.store.runLocalNode()}>
//   <div className='signerPermissionOrigin'>{'Run Local Node'}</div>
//   <div className={this.store('local.node.run') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'}>
//     <div className='signerPermissionToggleSwitch' />
//   </div>
// </div>
