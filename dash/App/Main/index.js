import React from 'react'
import Restore from 'react-restore'
import { okPort, okProtocol } from '../../../resources/connections'
import link from '../../../resources/link'
import svg from '../../../resources/svg'

class Settings extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.customMessage = 'Custom Endpoint'
    const latticeEndpoint = context.store('main.latticeSettings.endpointCustom')
    const latticeEndpointMode = context.store('main.latticeSettings.endpointMode')
    this.state = {
      localShake: {},
      latticeEndpoint,
      latticeEndpointMode,
      resetConfirm: false,
      expandNetwork: false,
      instanceIdHover: false,
      instanceIdCopied: false
    }
  }

  appInfo() {
    const appVersion = require('../../../package.json').version
    const instanceId = this.store('main.instanceId')
    return (
      <div className='appInfo'>
        <div className='appInfoLine appInfoLineVersion'>{`v${appVersion}`}</div>
        <div className='appInfoLine appInfoLineReset'>
          {this.state.resetConfirm ? (
            <>
              <span className='appInfoLineResetConfirm'>Are you sure you want to reset everything?</span>
              <span className='appInfoLineResetConfirmButtons'>
                <span
                  className='appInfoLineResetConfirmButton'
                  onClick={() => link.send('tray:resetAllSettings')}
                >
                  Yes
                </span>
                <span> / </span>
                <span
                  className='appInfoLineResetConfirmButton'
                  onClick={() => this.setState({ resetConfirm: false })}
                >
                  No
                </span>
              </span>
            </>
          ) : (
            <span className='appInfoLineResetButton' onClick={() => this.setState({ resetConfirm: true })}>
              Reset All Settings & Data
            </span>
          )}
        </div>
        <div
          className='appInfoLine appInfoLineInstanceId'
          onMouseOver={(e) => {
            e.stopPropagation()
            e.preventDefault()
            this.setState({ instanceIdHover: true })
          }}
          onMouseLeave={(e) => {
            e.stopPropagation()
            e.preventDefault()
            this.setState({ instanceIdHover: false, instanceIdCopied: false })
          }}
          onClick={() => {
            if (this.state.instanceIdHover) {
              clearTimeout(this.instanceIdCopiedTimeout)
              link.send('tray:clipboardData', instanceId)
              this.setState({ instanceIdCopied: true })
              this.instanceIdCopiedTimeout = setTimeout(
                () => this.setState({ instanceIdCopied: false }),
                1800
              )
            }
          }}
        >
          {this.state.instanceIdCopied ? (
            <span className='instanceIdCopied'>{'Instance ID Copied'}</span>
          ) : (
            instanceId
          )}
        </div>
      </div>
    )
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

  customPrimaryFocus() {
    if (this.state.primaryCustom === this.customMessage) this.setState({ primaryCustom: '' })
  }

  customPrimaryBlur() {
    if (this.state.primaryCustom === '') this.setState({ primaryCustom: this.customMessage })
  }

  inputPrimaryCustom(e) {
    e.preventDefault()
    clearTimeout(this.customPrimaryInputTimeout)
    const value = e.target.value.replace(/\s+/g, '')
    this.setState({ primaryCustom: value })
    const { type, id } = this.store('main.currentNetwork')
    this.customPrimaryInputTimeout = setTimeout(
      () => link.send('tray:action', 'setPrimaryCustom', type, id, this.state.primaryCustom),
      1000
    )
  }

  inputSecondaryCustom(e) {
    e.preventDefault()
    clearTimeout(this.customSecondaryInputTimeout)
    const value = e.target.value.replace(/\s+/g, '')
    this.setState({ secondaryCustom: value })
    const { type, id } = this.store('main.currentNetwork')
    this.customSecondaryInputTimeout = setTimeout(
      () => link.send('tray:action', 'setSecondaryCustom', type, id, this.state.secondaryCustom),
      1000
    )
  }

  inputLatticeEndpoint(e) {
    e.preventDefault()
    clearTimeout(this.inputLatticeTimeout)
    const value = e.target.value.replace(/\s+/g, '')
    this.setState({ latticeEndpoint: value })
    // TODO: Update to target specific Lattice device rather than global
    this.inputLatticeTimeout = setTimeout(
      () => link.send('tray:action', 'setLatticeEndpointCustom', this.state.latticeEndpoint),
      1000
    )
  }

  localShake(key) {
    const localShake = Object.assign({}, this.state.localShake)
    localShake[key] = true
    this.setState({ localShake })
    setTimeout(() => {
      const localShake = Object.assign({}, this.state.localShake)
      localShake[key] = false
      this.setState({ localShake })
    }, 1010)
  }

  status(layer) {
    const { type, id } = this.store('main.currentNetwork')
    const connection = this.store('main.networks', type, id, 'connection', layer)
    let status = connection.status
    const current = connection.current

    if (current === 'custom') {
      if (
        layer === 'primary' &&
        this.state.primaryCustom !== '' &&
        this.state.primaryCustom !== this.customMessage
      ) {
        if (!okProtocol(this.state.primaryCustom)) status = 'invalid target'
        else if (!okPort(this.state.primaryCustom)) status = 'invalid port'
      }

      if (
        layer === 'secondary' &&
        this.state.secondaryCustom !== '' &&
        this.state.secondaryCustom !== this.customMessage
      ) {
        if (!okProtocol(this.state.secondaryCustom)) status = 'invalid target'
        else if (!okPort(this.state.secondaryCustom)) status = 'invalid port'
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

  discord() {
    return (
      <div
        className='discordInvite'
        onClick={() => link.send('tray:openExternal', 'https://discord.gg/UH7NGqY')}
      >
        <div>Need help?</div>
        <div className='discordLink'>Join our Discord!</div>
      </div>
    )
  }

  quit() {
    return (
      <div className='addCustomTokenButtonWrap quitFrame' style={{ zIndex: 215 }}>
        <div className='addCustomTokenButton' onClick={() => link.send('tray:quit')}>
          Quit
        </div>
      </div>
    )
  }

  indicator(status) {
    if (status === 'connected') {
      return (
        <div className='connectionOptionStatusIndicator'>
          <div className='connectionOptionStatusIndicatorGood' />
        </div>
      )
    } else if (status === 'loading' || status === 'syncing' || status === 'pending' || status === 'standby') {
      return (
        <div className='connectionOptionStatusIndicator'>
          <div className='connectionOptionStatusIndicatorPending' />
        </div>
      )
    } else {
      return (
        <div className='connectionOptionStatusIndicator'>
          <div className='connectionOptionStatusIndicatorBad' />
        </div>
      )
    }
  }

  selectNetwork(network) {
    const [type, id] = network.split(':')
    if (network.type !== type || network.id !== id) link.send('tray:action', 'selectNetwork', type, id)
  }

  expandNetwork(e, expand) {
    e.stopPropagation()
    this.setState({ expandNetwork: expand !== undefined ? expand : !this.state.expandNetwork })
  }

  render() {
    const { type, id } = { type: 'ethereum', id: 1 } // TODO
    const networks = this.store('main.networks')
    // const connection = networks[type][id].connection
    const networkPresets = this.store('main.networkPresets', type)
    let presets = networkPresets[id] || {}
    presets = Object.keys(presets).map((i) => ({ text: i, value: type + ':' + id + ':' + i }))
    presets = presets.concat(
      Object.keys(networkPresets.default).map((i) => ({ text: i, value: type + ':' + id + ':' + i }))
    )
    presets.push({ text: 'Custom', value: type + ':' + id + ':' + 'custom' })

    const networkOptions = []
    Object.keys(networks).forEach((type) => {
      Object.keys(networks[type]).forEach((id) => {
        networkOptions.push({ text: networks[type][id].name, value: type + ':' + id })
      })
    })
    return (
      <div className={'localSettings cardShow'}>
        <div className='localSettingsWrap'>
          <div className='dashModules'>
            <div
              className='dashModule'
              onClick={() => link.send('tray:action', 'navDash', { view: 'accounts', data: {} })}
            >
              <div className='dashModuleIcon'>{svg.accounts(24)}</div>
              <div className='dashModuleTitle'>{'Accounts'}</div>
            </div>
            <div
              className='dashModule'
              onClick={() => link.send('tray:action', 'navDash', { view: 'chains', data: {} })}
            >
              <div className='dashModuleIcon'>{svg.chain(24)}</div>
              <div className='dashModuleTitle'>{'Chains'}</div>
            </div>
            <div
              className='dashModule'
              onClick={() => link.send('tray:action', 'navDash', { view: 'tokens', data: {} })}
            >
              <div className='dashModuleIcon'>{svg.tokens(24)}</div>
              <div className='dashModuleTitle'>{'Tokens'}</div>
            </div>
            <div
              className='dashModule'
              onClick={() => link.send('tray:action', 'navDash', { view: 'dapps', data: {} })}
            >
              <div className='dashModuleIcon'>{svg.window(24)}</div>
              <div className='dashModuleTitle'>{'Dapps'}</div>
            </div>
            <div
              className='dashModule'
              onClick={() => link.send('tray:action', 'navDash', { view: 'settings', data: {} })}
            >
              <div className='dashModuleIcon'>{svg.settings(24)}</div>
              <div className='dashModuleTitle'>{'Settings'}</div>
            </div>
          </div>
          <div className='snipIt'>
            <div>Using a dapp that doesn't support Frame natively?</div>
            <div className='snipItBrowserExtensionIcons'>
              <div
                className='snipItBrowserExtensionIcon snipItBrowserExtensionIconChrome'
                onClick={() =>
                  link.send(
                    'tray:openExternal',
                    'https://chrome.google.com/webstore/detail/frame-alpha/ldcoohedfbjoobcadoglnnmmfbdlmmhf'
                  )
                }
              >
                {svg.chrome(28)}
              </div>
              <div
                className='snipItBrowserExtensionIcon snipItBrowserExtensionIconFirefox'
                onClick={() =>
                  link.send(
                    'tray:openExternal',
                    'https://addons.mozilla.org/en-US/firefox/addon/frame-extension'
                  )
                }
              >
                {svg.firefox(28)}
              </div>
              {/* <div 
                className='snipItBrowserExtensionIcon snipItBrowserExtensionIconSafari'
              >
                {svg.safari(28)}
              </div> */}
            </div>
            <div>Inject a connection with our browser extension!</div>
          </div>
          <div className='requestFeature'>
            <div
              className='requestFeatureButton'
              onClick={() => {
                link.send('tray:openExternal', 'https://feedback.frame.sh')
              }}
            >
              Request a Feature
            </div>
          </div>
          <div className='requestFeature'>
            <div
              className='requestFeatureButton'
              onClick={() => {
                link.send('tray:openExternal', 'https://discord.gg/UH7NGqY')
              }}
            >
              Need help? Join our Discord!
            </div>
          </div>
          <div className='requestFeature'>
            <div
              className='requestFeatureButton'
              onClick={() => {
                link.send('tray:quit')
              }}
            >
              Quit
            </div>
          </div>
          <div
            className='viewLicense'
            onClick={() =>
              link.send('tray:openExternal', 'https://github.com/floating/frame/blob/master/LICENSE')
            }
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
