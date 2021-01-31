import React from 'react'
import Restore from 'react-restore'
import link from '../../../link'
import svg from '../../../svg'
// import Client from '../Client'

import Dropdown from '../../Components/Dropdown'

class Settings extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.customMessage = 'Custom Endpoint'
    this.network = context.store('main.currentNetwork.id')
    this.networkType = context.store('main.currentNetwork.type')
    const primaryCustom = context.store('main.networks', this.networkType, this.network, 'connection.primary.custom') || this.customMessage
    const secondaryCustom = context.store('main.networks', this.networkType, this.network, 'connection.secondary.custom') || this.customMessage
    this.state = { localShake: {}, primaryCustom, secondaryCustom, resetConfirm: false, expandNetwork: false }
    context.store.observer(() => {
      const { type, id } = context.store('main.currentNetwork')
      if (this.network !== id || this.networkType !== type) {
        this.networkType = type
        this.network = id
        const primaryCustom = context.store('main.networks', type, id, 'connection.primary.custom') || this.customMessage
        const secondaryCustom = context.store('main.networks', type, id, 'connection.secondary.custom') || this.customMessage
        this.setState({ primaryCustom, secondaryCustom })
      }
    })
  }

  appInfo () {
    return (
      <div className='appInfo'>
        <div className='appInfoIcon'><div className='appInfoHandle' /></div>
        <div className='appInfoLine appInfoLineReset'>
          {this.state.resetConfirm ? (
            <span className='appInfoLineResetConfirm'>
              Are you sure? <span onMouseDown={() => link.send('tray:resetAllSettings')}>Yes</span> <span>/</span> <span onMouseDown={() => this.setState({ resetConfirm: false })}>No</span>
            </span>
          ) : (
            <span onMouseDown={() => this.setState({ resetConfirm: true })}>Reset All Settings & Data</span>
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

  customSecondaryFocus () {
    if (this.state.secondaryCustom === this.customMessage) this.setState({ secondaryCustom: '' })
  }

  customSecondaryBlur () {
    if (this.state.secondaryCustom === '') this.setState({ secondaryCustom: this.customMessage })
  }

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
      if (layer === 'primary' && this.state.primaryCustom !== '' && this.state.primaryCustom !== this.customMessage && !this.okProtocol(this.state.primaryCustom)) status = 'invalid target'
      if (layer === 'secondary' && this.state.secondaryCustom !== '' && this.state.secondaryCustom !== this.customMessage && !this.okProtocol(this.state.secondaryCustom)) status = 'invalid target'
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
      <div className='discordInvite' onMouseDown={() => link.send('tray:openExternal', 'https://discord.gg/UH7NGqY')}>
        <div>Need help or have a request?</div>
        <div className='discordLink'>Join our Discord!</div>
      </div>
    )
  }

  quit () {
    return (
      <div className='quitFrame'>
        <div onMouseDown={() => link.send('tray:quit')} className='quitFrameButton'>Quit</div>
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
    const { type, id } = this.store('main.currentNetwork')
    const networks = this.store('main.networks')
    const connection = networks[type][id].connection
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
      <div className={this.store('panel.view') !== 'settings' ? 'localSettings localSettingsHidden' : 'localSettings'} onMouseDown={e => this.expandNetwork(e, false)}>
        <div className='localSettingsWrapFadeTop' />
        <div className='localSettingsWrapFadeBot' />
        <div className='localSettingsWrap'>
          <div className='localSettingsTitle connectionTitle' style={{ zIndex: 3 }}>
            <div className='localSettingsTitleText'>Connection</div>
            <div className='localSettingsAddNetwork' onMouseDown={() => this.store.toggleAddNetwork()}>{svg.broadcast(16)}</div>
            <Dropdown
              syncValue={type + ':' + id}
              onChange={(network) => this.selectNetwork(network)}
              options={networkOptions}
            />
          </div>
          <div className='signerPermission' style={{ zIndex: 2 }}>
            <div className={connection.primary.on ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
              <div className='connectionOptionToggle'>
                <div className='signerPermissionOrigin'>Primary</div>
                <div className={connection.primary.on ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => link.send('tray:action', 'toggleConnection', type, id, 'primary')}>
                  <div className='signerPermissionToggleSwitch' />
                </div>
              </div>
              <div className='connectionOptionDetails'>
                <div className='connectionOptionDetailsInset'>
                  {this.status('primary')}
                  <Dropdown
                    syncValue={type + ':' + id + ':' + connection.primary.current}
                    onChange={preset => {
                      const [type, id, value] = preset.split(':')
                      link.send('tray:action', 'selectPrimary', type, id, value)
                    }}
                    options={presets}
                  />
                </div>
              </div>
              <div className={connection.primary.current === 'custom' && connection.primary.on ? 'connectionCustomInput connectionCustomInputOn' : 'connectionCustomInput'}>
                <input tabIndex='-1' value={this.state.primaryCustom} onFocus={() => this.customPrimaryFocus()} onBlur={() => this.customPrimaryBlur()} onChange={e => this.inputPrimaryCustom(e)} />
              </div>
            </div>
          </div>
          <div className='signerPermission' style={{ zIndex: 1 }}>
            <div className={connection.secondary.on ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
              <div className='connectionOptionToggle'>
                <div className='signerPermissionOrigin'>Secondary</div>
                <div className={connection.secondary.on ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => link.send('tray:action', 'toggleConnection', type, id, 'secondary')}>
                  <div className='signerPermissionToggleSwitch' />
                </div>
              </div>
              <div className='connectionOptionDetails'>
                <div className='connectionOptionDetailsInset'>
                  {this.status('secondary')}
                  <Dropdown
                    syncValue={type + ':' + id + ':' + connection.secondary.current}
                    onChange={preset => {
                      const [type, id, value] = preset.split(':')
                      link.send('tray:action', 'selectSecondary', type, id, value)
                    }}
                    options={presets}
                  />
                </div>
              </div>
              <div className={connection.secondary.current === 'custom' && connection.secondary.on ? 'connectionCustomInput connectionCustomInputOn' : 'connectionCustomInput'}>
                <input tabIndex='-1' value={this.state.secondaryCustom} onFocus={() => this.customSecondaryFocus()} onBlur={() => this.customSecondaryBlur()} onChange={e => this.inputSecondaryCustom(e)} />
              </div>
            </div>
          </div>
          <div className='localSettingsTitle'>
            <div className='localSettingsTitleText'>Settings</div>
          </div>
          <div className='signerPermission' style={{ zIndex: 10 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionOrigin'>Summon Shortcut</div>
              <div className={this.store('main.shortcuts.altSlash') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => link.send('tray:action', 'setAltSpace', !this.store('main.shortcuts.altSlash'))}>
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>
              <span>
                Summon Frame by pressing <span className='keyCommand'>{this.store('platform') === 'darwin' ? 'Option' : 'Alt'}<span style={{ padding: '0px 3px' }}>+</span>/</span>
              </span>
            </div>
          </div>
          <div className='signerPermission' style={{ zIndex: 9 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionOrigin'>Auto-hide</div>
              <div className={this.store('main.autohide') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => link.send('tray:action', 'setAutohide', !this.store('main.autohide'))}>
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>
              <span>
                Hide Frame on loss of focus
              </span>
            </div>
          </div>
          <div className='signerPermission' style={{ zIndex: 8 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionOrigin'>Run on Startup</div>
              <div className={this.store('main.launch') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => link.send('tray:action', 'toggleLaunch')}>
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>
              Run Frame when your computer starts
            </div>
          </div>
          <div className='signerPermission' style={{ zIndex: 7 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionOrigin'>Glide</div>
              <div className={this.store('main.reveal') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => link.send('tray:action', 'toggleReveal')}>
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>
              {'Mouse to your display\'s right edge to summon Frame'}
            </div>
          </div>
          <div className='signerPermission' style={{ zIndex: 6 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionOrigin'>Adjustable Nonce</div>
              <div className={this.store('main.nonceAdjust') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => {
                link.send('tray:action', 'toggleNonceAdjust')
                if (!this.store('main.nonceAdjust')) this.store.notify('nonceWarning')
              }}>
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>
              {'Adds the ability to edit a transaction\'s nonce'}
            </div>
          </div>
          {/* <div className='signerPermission' style={{ zIndex: 6 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionOrigin'>Show USD Value</div>
              <div className={this.store('main.showUSDValue') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => link.send('tray:action', 'toggleUSDValue')}>
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>
              Show USD value of Ether and token balances
            </div>
          </div> */}
          {this.store('platform') === 'darwin' ? (
            <div className='signerPermission' style={{ zIndex: 5 }}>
              <div className='signerPermissionControls'>
                <div className='signerPermissionOrigin'>Display Gas in Menubar</div>
                <div className={this.store('main.menubarGasPrice') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => link.send('tray:action', 'setMenubarGasPrice', !this.store('main.menubarGasPrice'))}>
                  <div className='signerPermissionToggleSwitch' />
                </div>
              </div>
              <div className='signerPermissionDetails'>
                Show mainnet gas price (Gwei) in menubar
              </div>
            </div>
          ) : null}
          <div className='signerPermission' style={{ zIndex: 4 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionOrigin'>Hardware Derivation</div>
              <Dropdown
                syncValue={this.store('main.hardwareDerivation')}
                onChange={(value) => link.send('tray:action', 'setHardwareDerivation', value)}
                options={[{ text: 'Mainnet', value: 'mainnet' }, { text: 'Testnet', value: 'testnet' }]}
              />
            </div>
            <div className='signerPermissionDetails'>
              Derive seperate sets of addresses based on use
            </div>
          </div>
          <div className='signerPermission' style={{ zIndex: 3 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionOrigin'>Ledger Type</div>
              <Dropdown
                syncValue={this.store('main.ledger.derivation')}
                onChange={(value) => link.send('tray:action', 'setLedgerDerivation', value)}
                options={[{ text: 'Legacy', value: 'legacy' }, { text: 'Live', value: 'live' }]}
              />
            </div>
            <div className='signerPermissionDetails'>
              {'Use Ledger\'s Legacy or Live derivation type'}
            </div>
          </div>
          <div className='signerPermission' style={{ zIndex: 2 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionOrigin'>Ledger Live Accounts</div>
              <Dropdown
                syncValue={this.store('main.ledger.liveAccountLimit')}
                onChange={(value) => link.send('tray:action', 'setLiveAccountLimit', value)}
                options={[
                  { text: '5', value: 5 },
                  { text: '10', value: 10 },
                  { text: '20', value: 20 },
                  { text: '40', value: 40 }
                ]}
              />
            </div>
            <div className='signerPermissionDetails'>
              The number of live accounts to derive
            </div>
          </div>
          <div className='signerPermission' style={{ zIndex: 1 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionOrigin'>Lock Hot Signers on</div>
              <Dropdown
                syncValue={this.store('main.accountCloseLock')}
                onChange={(value) => link.send('tray:action', 'setAccountCloseLock', value)}
                options={[{ text: 'Close', value: true }, { text: 'Quit', value: false }]}
              />
            </div>
            <div className='signerPermissionDetails'>
              When should Frame relock your hot signers?
            </div>
          </div>
          <div className='snipIt'>
            <div>Browser dapp doesn't support Frame natively?</div>
            <div className='snipItBrowserExtensionIcons'>
              <div className='snipItBrowserExtensionIcon snipItSpinLeft' onMouseDown={() => this.store.notify('openExternal', { url: 'https://chrome.google.com/webstore/detail/frame-alpha/ldcoohedfbjoobcadoglnnmmfbdlmmhf' })}>
                {svg.chrome(30)}
              </div>
              <div className='snipItBrowserExtensionIcon snipItSpinRight' onMouseDown={() => this.store.notify('openExternal', { url: 'https://addons.mozilla.org/en-US/firefox/addon/frame-extension' })}>
                {svg.firefox(30)}
              </div>
            </div>
            <div>Inject Frame with our browser extension!</div>
          </div>
          {this.discord()}
          {this.quit()}
          <div className='viewLicense' onMouseDown={() => this.store.notify('openExternal', { url: 'https://github.com/floating/frame/blob/master/LICENSE' })}>View License</div>
        </div>
        {this.appInfo()}
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

/* <div className='signerPermission'>
  <div className={this.store('main..connection.local.on') ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
    <div className='connectionOptionToggle'>
      <div className='signerPermissionOrigin'>Local</div>
      <div className={this.store('main..connection.local.on') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => link.send('tray:action', 'toggleConnection', 'primary')}>
        <div className='signerPermissionToggleSwitch' />
      </div>
    </div>
    <div className='connectionOptionDetails'>
      <div className='connectionOptionDetailsInset'>
        {this.status(this.store('main..connection.local'))}
        <div className='signerOptionSetWrap'>
          <div className={this.state.localShake.custom ? 'signerOptionSet headShake' : 'signerOptionSet'} onMouseDown={() => this.localShake('custom')}>
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
