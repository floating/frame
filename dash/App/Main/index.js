import React from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
import svg from '../../../resources/svg'

class Settings extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.customMessage = 'Custom Endpoint'
    // this.network = context.store('main.currentNetwork.id')
    // this.networkType = context.store('main.currentNetwork.type')
    // const primaryCustom = context.store('main.networks', this.networkType, this.network, 'connection.primary.custom') || this.customMessage
    // const secondaryCustom = context.store('main.networks', this.networkType, this.network, 'connection.secondary.custom') || this.customMessage
    const latticeEndpoint = context.store('main.latticeSettings.endpointCustom')
    const latticeEndpointMode = context.store('main.latticeSettings.endpointMode')
    this.state = { localShake: {}, latticeEndpoint, latticeEndpointMode, resetConfirm: false, expandNetwork: false }
    // context.store.observer(() => {
    //   const { type, id } = context.store('main.currentNetwork')
    //   if (this.network !== id || this.networkType !== type) {
    //     this.networkType = type
    //     this.network = id
    //     const primaryCustom = context.store('main.networks', type, id, 'connection.primary.custom') || this.customMessage
    //     const secondaryCustom = context.store('main.networks', type, id, 'connection.secondary.custom') || this.customMessage
    //     this.setState({ primaryCustom, secondaryCustom })
    //   }
    // })
  }

  appInfo () {
    return (
      <div className='appInfo'>
        <div className='appInfoLine appInfoLineVersion'>{'v' + require('../../../package.json').version}</div>
        <div className='appInfoLine appInfoLineReset'>
          {this.state.resetConfirm ? (
            <span className='appInfoLineResetConfirm'>
              Are you sure you want to reset everything? <span className='pointer' onClick={() => link.send('tray:resetAllSettings')}>Yes</span> <span>/</span> <span className='pointer' onClick={() => this.setState({ resetConfirm: false })}>No</span>
            </span>
          ) : (
            <span className='pointer' onClick={() => this.setState({ resetConfirm: true })}>Reset All Settings & Data</span>
          )}
        </div>
      </div>
    )
  }

  okProtocol (location) {
    console.log('MAIN')
    if (location === 'injected') return true
    if (location.endsWith('.ipc')) return true
    if (location.startsWith('wss://') || location.startsWith('ws://')) return true
    if (location.startsWith('https://') || location.startsWith('http://')) return true
    return false
  }

  okPort (location) {
    const match = location.match(/^(?:https?|wss?).*:(?<port>\d{4,})/)

    if (match) {
      const portStr = (match.groups || { port: 0 }).port
      const port = parseInt(portStr)
      return port >= 0 && port <= 65535
    }

    return true
  }

  //
  // latticeFocus () {
  //   if (this.state.latticeEndpoint === this.customMessage) this.setState({ secondaryCustom: '' })
  // }
  //
  // latticeBlur () {
  //   if (this.state.secondaryCustom === '') this.setState({ secondaryCustom: this.customMessage })
  // }

  // customSecondaryFocus () {
  //   if (this.state.secondaryCustom === this.customMessage) this.setState({ secondaryCustom: '' })
  // }

  // customSecondaryBlur () {
  //   if (this.state.secondaryCustom === '') this.setState({ secondaryCustom: this.customMessage })
  // }

  customPrimaryFocus () {
    if (this.state.primaryCustom === this.customMessage) this.setState({ primaryCustom: '' })
  }

  customPrimaryBlur () {
    if (this.state.primaryCustom === '') this.setState({ primaryCustom: this.customMessage })
  }

  inputPrimaryCustom (e) {
    e.preventDefault()
    clearTimeout(this.customPrimaryInputTimeout)
    const value = e.target.value.replace(/\s+/g, '')
    this.setState({ primaryCustom: value })
    const { type, id } = this.store('main.currentNetwork')
    this.customPrimaryInputTimeout = setTimeout(() => link.send('tray:action', 'setPrimaryCustom', type, id, this.state.primaryCustom), 1000)
  }

  inputSecondaryCustom (e) {
    e.preventDefault()
    clearTimeout(this.customSecondaryInputTimeout)
    const value = e.target.value.replace(/\s+/g, '')
    this.setState({ secondaryCustom: value })
    const { type, id } = this.store('main.currentNetwork')
    this.customSecondaryInputTimeout = setTimeout(() => link.send('tray:action', 'setSecondaryCustom', type, id, this.state.secondaryCustom), 1000)
  }

  inputLatticeEndpoint (e) {
    e.preventDefault()
    clearTimeout(this.inputLatticeTimeout)
    const value = e.target.value.replace(/\s+/g, '')
    this.setState({ latticeEndpoint: value })
    // TODO: Update to target specific Lattice device rather than global
    this.inputLatticeTimeout = setTimeout(() => link.send('tray:action', 'setLatticeEndpointCustom', this.state.latticeEndpoint), 1000)
  }

  localShake (key) {
    const localShake = Object.assign({}, this.state.localShake)
    localShake[key] = true
    this.setState({ localShake })
    setTimeout(() => {
      const localShake = Object.assign({}, this.state.localShake)
      localShake[key] = false
      this.setState({ localShake })
    }, 1010)
  }

  status (layer) {
    const { type, id } = this.store('main.currentNetwork')
    const connection = this.store('main.networks', type, id, 'connection', layer)
    let status = connection.status
    const current = connection.current

    if (current === 'custom') {
      if (layer === 'primary' && this.state.primaryCustom !== '' && this.state.primaryCustom !== this.customMessage) {
        if (!this.okProtocol(this.state.primaryCustom)) status = 'invalid target'
        else if (!this.okPort(this.state.primaryCustom)) status = 'invalid port'
      }

      if (layer === 'secondary' && this.state.secondaryCustom !== '' && this.state.secondaryCustom !== this.customMessage) {
        if (!this.okProtocol(this.state.secondaryCustom)) status = 'invalid target'
        else if (!this.okPort(this.state.secondaryCustom)) status = 'invalid port'
      }
    }
    if (status === 'connected' && !connection.network) status = 'loading'
    return (
      <div className='connectionOptionStatus'>
        {this.indicator(status)}
        <div className='connectionOptionStatusText'>{status}</div>
      </div>
    )
  }

  discord () {
    return (
      <div className='discordInvite' onClick={() => link.send('tray:openExternal', 'https://discord.gg/UH7NGqY') }>
        <div>Need help?</div>
        <div className='discordLink'>Join our Discord!</div>
      </div>
    )
  }

  quit () {
    return (
      <div className='addCustomTokenButtonWrap quitFrame' style={{ zIndex: 215 }}>
        <div className='addCustomTokenButton' onClick={() => link.send('tray:quit')}>
          Quit
        </div>
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

  selectNetwork (network) {
    const [type, id] = network.split(':')
    if (network.type !== type || network.id !== id) link.send('tray:action', 'selectNetwork', type, id)
  }

  expandNetwork (e, expand) {
    e.stopPropagation()
    this.setState({ expandNetwork: expand !== undefined ? expand : !this.state.expandNetwork })
  }

  render () {
    const { type, id } = { type: 'ethereum', id: 1 } // TODO
    const networks = this.store('main.networks')
    // const connection = networks[type][id].connection
    const networkPresets = this.store('main.networkPresets', type)
    let presets = networkPresets[id] || {}
    presets = Object.keys(presets).map(i => ({ text: i, value: type + ':' + id + ':' + i }))
    presets = presets.concat(Object.keys(networkPresets.default).map(i => ({ text: i, value: type + ':' + id + ':' + i })))
    presets.push({ text: 'Custom', value: type + ':' + id + ':' + 'custom' })

    const networkOptions = []
    Object.keys(networks).forEach(type => {
      Object.keys(networks[type]).forEach(id => {
        networkOptions.push({ text: networks[type][id].name, value: type + ':' + id })
      })
    })
    return (
      <div className={'localSettings cardShow'}>
        <div className='localSettingsWrap'>
          <div className='dashModule' onMouseDown={() => link.send('tray:action', 'navDash', { view: 'accounts', data: {} })}>
            <div className='dashModuleIcon'>{svg.accounts(24)}</div>
            <div className='dashModuleTitle'>{'Accounts'}</div>
          </div>
          <div className='dashModule' onMouseDown={() => link.send('tray:action', 'navDash', { view: 'chains', data: {} })}>
            <div className='dashModuleIcon'>{svg.chain(24)}</div>
            <div className='dashModuleTitle'>{'Chains'}</div>
          </div>
          <div className='dashModule' onMouseDown={() => link.send('tray:action', 'navDash', { view: 'dapps', data: {} })}>
            <div className='dashModuleIcon'>{svg.window(24)}</div>
            <div className='dashModuleTitle'>{'Dapps'}</div>
          </div>
          <div className='dashModule' onMouseDown={() => link.send('tray:action', 'navDash', { view: 'tokens', data: {} })}>
            <div className='dashModuleIcon'>{svg.tokens(24)}</div>
            <div className='dashModuleTitle'>{'Tokens'}</div>
          </div>
          <div className='dashModule' onMouseDown={() => link.send('tray:action', 'navDash', { view: 'settings', data: {} })}>
            <div className='dashModuleIcon'>{svg.settings(24)}</div>
            <div className='dashModuleTitle'>{'Settings'}</div>
          </div>
          <div className='snipIt'>
            <div>Using a dapp that doesn't support Frame natively?</div>
            <div className='snipItBrowserExtensionIcons'>
              <div 
                className='snipItBrowserExtensionIcon snipItBrowserExtensionIconChrome'
                onClick={() => link.send('tray:action', 'navDash', { view: 'notify', data: { notify: 'openExternal', notifyData: { url: 'https://chrome.google.com/webstore/detail/frame-alpha/ldcoohedfbjoobcadoglnnmmfbdlmmhf' } }})}
              >
                {svg.chrome(28)}
              </div>
              <div 
                className='snipItBrowserExtensionIcon snipItBrowserExtensionIconFirefox'
                onClick={() => link.send('tray:action', 'navDash', { view: 'notify', data: { notify: 'openExternal', notifyData: { url: 'https://addons.mozilla.org/en-US/firefox/addon/frame-extension' } }})}
              >
                {svg.firefox(28)}
              </div>
              <div 
                className='snipItBrowserExtensionIcon snipItBrowserExtensionIconSafari'
                onClick={() => link.send('tray:action', 'navDash', { view: 'notify', data: { notify: 'openExternal', notifyData: { url: 'https://addons.mozilla.org/en-US/firefox/addon/frame-extension' } }})}
              >
                {svg.safari(28)}
              </div>
            </div>
            <div>Inject a connection with our browser extension!</div>
          </div>
          <div className='requestFeature'>
            <div className='requestFeatureButton' onClick={() => {
              link.send('tray:openExternal', 'https://feedback.frame.sh')
            }}>
              Request a Feature 
            </div>
          </div>
          <div className='requestFeature'>
            <div className='requestFeatureButton' onClick={() => {
              link.send('tray:openExternal', 'https://discord.gg/UH7NGqY')
            }}>
              Need help? Join our Discord!
            </div>
          </div>
          <div className='requestFeature'>
            <div className='requestFeatureButton' onClick={() => {
              link.send('tray:quit')
            }}>
              Quit
            </div>
          </div>
          <div 
            className='viewLicense' 
            onClick={() => link.send('tray:action', 'navDash', { view: 'notify', data: { notify: 'openExternal', notifyData: { url: 'https://github.com/floating/frame/blob/master/LICENSE' } }})}
           >
            View License
          </div>
          {this.appInfo()}
        </div>
      </div>
    )
  }
}

export default Restore.connect(Settings)

// <div className='signerPermission localSetting'>
//   <div>{provider.url}</div>
//   <div className={this.store('node.provider') ? 'nodeProviderStatus nodeProviderConnected' : 'nodeProviderStatus'}>
//     {this.store('node.provider') ? 'connected' : 'disconnected'}
//   </div>
// </div>

// <div className='signerPermission localSetting' onClick={_ => this.store.runLocalNode()}>
//   <div className='signerPermissionSetting'>{'Run Local Node'}</div>
//   <div className={this.store('local.node.run') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'}>
//     <div className='signerPermissionToggleSwitch' />
//   </div>
// </div>

/* <div className='signerPermission localSetting'>
  <div className={this.store('main..connection.local.on') ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
    <div className='connectionOptionToggle'>
      <div className='signerPermissionSetting'>Local</div>
      <div className={this.store('main..connection.local.on') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onClick={_ => link.send('tray:action', 'toggleConnection', 'primary')}>
        <div className='signerPermissionToggleSwitch' />
      </div>
    </div>
    <div className='connectionOptionDetails'>
      <div className='connectionOptionDetailsInset'>
        {this.status(this.store('main..connection.local'))}
        <div className='signerOptionSetWrap'>
          <div className={this.state.localShake.custom ? 'signerOptionSet headShake' : 'signerOptionSet'} onClick={() => this.localShake('custom')}>
            <div className='signerOptionSetButton' />
            {this.store('main..connection.local.type') ? (
              <div className='signerOptionSetText'>{this.store('main..connection.local.type')}</div>
            ) : (_ => {
              const status = this.store('main..connection.local.status')
              if (status === 'not found' || status === 'loading' || status === 'disconnected') return <div>scanning...</div>
              return ''
            })()}
            <div className='signerOptionSetButton' />
          </div>
        </div>
      </div>
    </div>
  </div>
</div> */
