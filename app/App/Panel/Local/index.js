import React from 'react'
import Restore from 'react-restore'
import { ipcRenderer } from 'electron'

import svg from '../../../svg'

const networks = {1: 'Mainnet', 3: 'Ropsten', 4: 'Rinkeby', 42: 'Kovan'}

class Settings extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {localShake: false}
  }
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
  inputCustom (e) {
    e.preventDefault()
    clearTimeout(this.customInputTimeout)
    this.setState({customInput: e.target.value})
    this.customInputTimeout = setTimeout(() => {
      this.store.setSecondaryCustom(this.state.customInput)
    }, 1500)
  }
  localShake () {
    this.setState({localShake: true})
    setTimeout(() => this.setState({localShake: false}), 1010)
  }
  status (connection) {
    let status = connection.status
    if (status === 'connected' && connection.network !== this.store('local.connection.network')) status = 'network mismatch'
    if (status === 'unsuccessful') status = 'not found'
    return (
      <div className='connectionOptionStatus'>
        {this.indicator(status)}
        <div className='connectionOptionStatusText'>{status}</div>
      </div>
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
          <div className='connectionTitleSet'>
            <div className='connectionTitleSetButton' onClick={() => this.store.selectNetwork('<-')}>
              {svg.octicon('chevron-left', {height: 17})}
            </div>
            <div className='connectionTitleSetText'>{networks[this.store('local.connection.network')] || 'Unknown, ID: ' + this.store('local.connection.network')}</div>
            <div className='connectionTitleSetButton' onClick={() => this.store.selectNetwork('->')}>
              {svg.octicon('chevron-right', {height: 17})}
            </div>
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
              <div className='connectionOptionDetailsInset'>
                {this.status(this.store('local.connection.local'))}
                <div className='signerOptionSetWrap'>
                  <div className={this.state.localShake ? 'signerOptionSet headShake' : 'signerOptionSet'} onClick={() => this.localShake()}>
                    <div className='signerOptionSetButton' />
                    {this.store('local.connection.local.type') ? (
                      <div className='signerOptionSetText'>{this.store('local.connection.local.type')}</div>
                    ) : (_ => {
                      if (this.store('local.connection.local.status') === 'not found') return <div>{'scanning...'}</div>
                      if (this.store('local.connection.local.status') === 'disconnected') return svg.octicon('search', {height: 14})
                      return ''
                    })()}
                    <div className='signerOptionSetButton' />
                  </div>
                </div>
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
              <div className='connectionOptionDetailsInset'>
                {this.status(this.store('local.connection.secondary'))}
                <div className='signerOptionSet'>
                  <div className='signerOptionSetButton' onClick={() => this.store.selectSecondary('<-')}>{svg.octicon('chevron-left', {height: 14})}</div>
                  <div className='signerOptionSetText'>{this.store('local.connection.secondary.current')}</div>
                  <div className='signerOptionSetButton' onClick={() => this.store.selectSecondary('<-')}>{svg.octicon('chevron-right', {height: 14})}</div>
                </div>
              </div>
            </div>
            <div className={this.store('local.connection.secondary.current') === 'custom' && this.store('local.connection.secondary.on') ? 'connectionCustomInput connectionCustomInputOn' : 'connectionCustomInput'}>
              <input onChange={e => this.inputCustom(e)} />
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
