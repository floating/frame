import React from 'react'
import Restore from 'react-restore'
import svg from '../../../svg'
import link from '../../../link'

const networks = { 1: 'Mainnet', 3: 'Ropsten', 4: 'Rinkeby', 42: 'Kovan' }

class Settings extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.customMessage = 'Custom Endpoint'
    this.state = { localShake: {}, secondaryCustom: this.customMessage, resetConfirm: false, expandNetwork: false }
    context.store.observer(() => {
      let secondaryCustom = context.store('local.connection.secondary.settings', context.store('local.connection.network'), 'options.custom') || this.customMessage
      this.setState({ secondaryCustom })
    })
  }
  appInfo () {
    return (
      <div className='appInfo'>
        <div className='appInfoIcon'><div className='appInfoHandle' /></div>
        <div className='appInfoLine appInfoLineReset'>
          {this.state.resetConfirm ? (
            <span className='appInfoLineResetConfirm'>
              {'Are you sure?'} <span onMouseDown={() => link.send('tray:resetAllSettings')}>{'Yes'}</span> <span>{'/'}</span> <span onMouseDown={() => this.setState({ resetConfirm: false })}>{'No'}</span>
            </span>
          ) : (
            <span onMouseDown={() => this.setState({ resetConfirm: true })}>{'Reset All Settings & Data'}</span>
          )}
        </div>
        <div className='appInfoLine appInfoLineVersion'>{'v' + require('../../../../package.json').version}</div>
      </div>
    )
  }
  okProtocol (location) {
    if (location === 'injected') return true
    if (location.endsWith('.ipc')) return true
    if (location.startsWith('wss://') || location.startsWith('ws://')) return true
    if (location.startsWith('https://') || location.startsWith('http://')) return true
    return false
  }
  customFocus () {
    if (this.state.secondaryCustom === this.customMessage) this.setState({ secondaryCustom: '' })
  }
  customBlur () {
    if (this.state.secondaryCustom === '') this.setState({ secondaryCustom: this.customMessage })
  }
  inputCustom (e) {
    e.preventDefault()
    clearTimeout(this.customInputTimeout)
    let value = e.target.value
    this.setState({ secondaryCustom: value })
    this.customInputTimeout = setTimeout(() => this.store.setSecondaryCustom(this.state.secondaryCustom), 1000)
  }
  localShake (key) {
    let localShake = Object.assign({}, this.state.localShake)
    localShake[key] = true
    this.setState({ localShake })
    setTimeout(() => {
      let localShake = Object.assign({}, this.state.localShake)
      localShake[key] = false
      this.setState({ localShake })
    }, 1010)
  }
  status (connection) {
    let status = connection.status
    let network = this.store('local.connection.network')
    let current = connection.settings[network].current
    if (current === 'custom' && this.state.secondaryCustom !== '' && this.state.secondaryCustom !== this.customMessage && !this.okProtocol(this.state.secondaryCustom)) status = 'invalid target'
    if (status === 'connected' && !connection.network) status = 'loading'
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
        <div onMouseDown={() => link.send('tray:quit')} className='quitFrameButton'>{'Quit'}</div>
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
  selectNetwork (net) {
    if (net !== this.store('local.connection.network')) {
      if (net === '1') {
        this.store.notify('mainnet')
      } else {
        this.store.selectNetwork(net)
      }
    }
  }
  expandNetwork (expand) {
    this.setState({ expandNetwork: expand !== undefined ? expand : !this.state.expandNetwork })
  }
  render () {
    let network = this.store('local.connection.network')
    let options = this.store('local.connection.options')
    let index = options.indexOf(network)
    let netSetStyle = { marginTop: this.state.expandNetwork ? '0px' : (-26 * index) + 'px' }
    return (
      <div className={this.store('panel.view') !== 'settings' ? 'localSettings localSettingsHidden' : 'localSettings'}>
        <div className='localSettingsTitle connectionTitle'>
          <div>{'Connection'}</div>
          <div className={this.state.expandNetwork ? 'connectionTitleSet connectionExpandNetwork' : 'connectionTitleSet'} onMouseDown={() => this.expandNetwork()}>
            <div className='connectionTitleSetItems' style={netSetStyle}>
              {options.map((option, index) => {
                return (
                  <div key={option + index} className='connectionTitleSetItem' onMouseDown={() => this.selectNetwork(option)}>
                    <div className='connectionTitleSetText'>{networks[option]}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className='signerPermission'>
          <div className={this.store('local.connection.local.on') ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
            <div className='connectionOptionToggle'>
              <div className='signerPermissionOrigin'>{'Local'}</div>
              <div className={this.store('local.connection.local.on') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => this.store.toggleConnection('local')}>
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='connectionOptionDetails'>
              <div className='connectionOptionDetailsInset'>
                {this.status(this.store('local.connection.local'))}
                <div className='signerOptionSetWrap'>
                  <div className={this.state.localShake.custom ? 'signerOptionSet headShake' : 'signerOptionSet'} onMouseDown={() => this.localShake('custom')}>
                    <div className='signerOptionSetButton' />
                    {this.store('local.connection.local.type') ? (
                      <div className='signerOptionSetText'>{this.store('local.connection.local.type')}</div>
                    ) : (_ => {
                      let status = this.store('local.connection.local.status')
                      if (status === 'not found' || status === 'loading' || status === 'disconnected') return <div>{'scanning...'}</div>
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
              <div className={this.store('local.connection.secondary.on') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => this.store.toggleConnection('secondary')}>
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='connectionOptionDetails'>
              <div className='connectionOptionDetailsInset'>
                {this.status(this.store('local.connection.secondary'))}
                <div className='signerOptionSet'>
                  <div className='signerOptionSetButton' onMouseDown={() => this.store.selectSecondary('<-')}>{svg.octicon('chevron-left', { height: 14 })}</div>
                  <div className='signerOptionSetText'>{this.store('local.connection.secondary.settings', network, 'current')}</div>
                  <div className='signerOptionSetButton' onMouseDown={() => this.store.selectSecondary('<-')}>{svg.octicon('chevron-right', { height: 14 })}</div>
                </div>
              </div>
            </div>
            <div className={this.store('local.connection.secondary.settings', network, 'current') === 'custom' && this.store('local.connection.secondary.on') ? 'connectionCustomInput connectionCustomInputOn' : 'connectionCustomInput'}>
              <input value={this.state.secondaryCustom} onFocus={() => this.customFocus()} onBlur={() => this.customBlur()} onChange={e => this.inputCustom(e)} />
            </div>
          </div>
        </div>
        <div className='localSettingsTitle'>{'Settings'}</div>
        <div className='signerPermission'>
          <div className='signerPermissionOrigin'>{'Run Frame on Startup'}</div>
          <div className={this.store('local.launch') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => this.store.toggleLaunch()}>
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

// <div className='signerPermission' onMouseDown={_ => this.store.runLocalNode()}>
//   <div className='signerPermissionOrigin'>{'Run Local Node'}</div>
//   <div className={this.store('local.node.run') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'}>
//     <div className='signerPermissionToggleSwitch' />
//   </div>
// </div>
