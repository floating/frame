import React from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'

import Dropdown from '../../../resources/Components/Dropdown'
import { okPort, okProtocol } from '../../../resources/connections'

class Settings extends React.Component {
  constructor(props, context) {
    super(props, context)
    // this.customMessage = 'Custom Endpoint'
    // this.network = context.store('main.currentNetwork.id')
    // this.networkType = context.store('main.currentNetwork.type')
    // const primaryCustom = context.store('main.networks', this.networkType, this.network, 'connection.primary.custom') || this.customMessage
    // const secondaryCustom = context.store('main.networks', this.networkType, this.network, 'connection.secondary.custom') || this.customMessage
    const latticeEndpoint = context.store('main.latticeSettings.endpointCustom')
    const latticeEndpointMode = context.store('main.latticeSettings.endpointMode')
    this.state = {
      localShake: {},
      latticeEndpoint,
      latticeEndpointMode,
      resetConfirm: false,
      expandNetwork: false
    }
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

  // appInfo () {
  //   return (
  //     <div className='appInfo'>
  //       <div className='appInfoLine appInfoLineVersion'>{'v' + require('../../../package.json').version}</div>
  //       <div className='appInfoLine appInfoLineReset'>
  //         {this.state.resetConfirm ? (
  //           <span className='appInfoLineResetConfirm'>
  //             Are you sure you want to reset everything? <span className='pointer' onClick={() => link.send('tray:resetAllSettings')}>Yes</span> <span>/</span> <span className='pointer' onClick={() => this.setState({ resetConfirm: false })}>No</span>
  //           </span>
  //         ) : (
  //           <span className='pointer' onClick={() => this.setState({ resetConfirm: true })}>Reset All Settings & Data</span>
  //         )}
  //       </div>
  //     </div>
  //   )
  // }

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
    return (
      <div className={'localSettings cardShow'}>
        <div className='localSettingsWrap'>
          {/* <Filter />    */}
          {/* <div className='requestFeature'>
            <div className='requestFeatureButton' onClick={() => link.send('tray:openExternal', 'https://feedback.frame.sh') }>
              Request a Feature 
            </div>
          </div> */}
          <div className='signerPermission localSetting' style={{ zIndex: 214 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionSetting'>Summon Shortcut</div>
              <div
                className={
                  this.store('main.shortcuts.altSlash')
                    ? 'signerPermissionToggle signerPermissionToggleOn'
                    : 'signerPermissionToggle'
                }
                onClick={(_) =>
                  link.send('tray:action', 'setAltSpace', !this.store('main.shortcuts.altSlash'))
                }
              >
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>
              <span>
                Summon Frame by pressing{' '}
                <span className='keyCommand'>
                  {this.store('platform') === 'darwin' ? 'Option' : 'Alt'}
                  <span style={{ padding: '0px 3px' }}>+</span>/
                </span>
              </span>
            </div>
          </div>
          <div className='signerPermission localSetting' style={{ zIndex: 213 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionSetting'>Auto-hide</div>
              <div
                className={
                  this.store('main.autohide')
                    ? 'signerPermissionToggle signerPermissionToggleOn'
                    : 'signerPermissionToggle'
                }
                onClick={(_) => link.send('tray:action', 'setAutohide', !this.store('main.autohide'))}
              >
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>
              <span>Hide Frame on loss of focus</span>
            </div>
          </div>
          <div className='signerPermission localSetting' style={{ zIndex: 212 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionSetting'>Run on Startup</div>
              <div
                className={
                  this.store('main.launch')
                    ? 'signerPermissionToggle signerPermissionToggleOn'
                    : 'signerPermissionToggle'
                }
                onClick={(_) => link.send('tray:action', 'toggleLaunch')}
              >
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>Run Frame when your computer starts</div>
          </div>
          <div className='signerPermission localSetting' style={{ zIndex: 211 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionSetting'>Glide</div>
              <div
                className={
                  this.store('main.reveal')
                    ? 'signerPermissionToggle signerPermissionToggleOn'
                    : 'signerPermissionToggle'
                }
                onClick={(_) => link.send('tray:action', 'toggleReveal')}
              >
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>{"Mouse to display's right edge to summon Frame"}</div>
          </div>
          {/* <div className='signerPermission localSetting' style={{ zIndex: 6 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionSetting'>Show USD Value</div>
              <div className={this.store('main.showUSDValue') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onClick={_ => link.send('tray:action', 'toggleUSDValue')}>
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>
              Show USD value of Ether and token balances
            </div>
          </div> */}
          {this.store('platform') === 'darwin' ? (
            <div className='signerPermission localSetting' style={{ zIndex: 210 }}>
              <div className='signerPermissionControls'>
                <div className='signerPermissionSetting'>Display Gas in Menubar</div>
                <div
                  className={
                    this.store('main.menubarGasPrice')
                      ? 'signerPermissionToggle signerPermissionToggleOn'
                      : 'signerPermissionToggle'
                  }
                  onClick={(_) =>
                    link.send('tray:action', 'setMenubarGasPrice', !this.store('main.menubarGasPrice'))
                  }
                >
                  <div className='signerPermissionToggleSwitch' />
                </div>
              </div>
              <div className='signerPermissionDetails'>Show mainnet gas price (Gwei) in menubar</div>
            </div>
          ) : null}

          <div className='signerPermission localSetting' style={{ zIndex: 209 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionSetting'>Error Reporting</div>
              <div
                className={
                  this.store('main.privacy.errorReporting')
                    ? 'signerPermissionToggle signerPermissionToggleOn'
                    : 'signerPermissionToggle'
                }
                onClick={(_) =>
                  link.send('tray:action', 'setErrorReporting', !this.store('main.privacy.errorReporting'))
                }
              >
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>
              <span>Help improve Frame by anonymously reporting errors</span>
            </div>
          </div>

          <div className='signerPermission localSetting' style={{ zIndex: 208 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionSetting'>Adjustable Nonce</div>
              <div
                className={
                  this.store('main.nonceAdjust')
                    ? 'signerPermissionToggle signerPermissionToggleOn'
                    : 'signerPermissionToggle'
                }
                onClick={(_) => {
                  link.send('tray:action', 'toggleNonceAdjust')
                  if (!this.store('main.nonceAdjust')) {
                    link.send('tray:action', 'navDash', {
                      view: 'notify',
                      data: { notify: 'nonceWarning', notifyData: {} }
                    })
                  }
                }}
              >
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>{"Adds the ability to edit a transaction's nonce"}</div>
          </div>

          <div className='signerPermission localSetting' style={{ zIndex: 207 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionSetting'>Show Account Name with ENS</div>
              <div
                className={
                  this.store('main.showLocalNameWithENS')
                    ? 'signerPermissionToggle signerPermissionToggleOn'
                    : 'signerPermissionToggle'
                }
                onClick={() => {
                  link.send('tray:action', 'toggleShowLocalNameWithENS')
                }}
              >
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>{'Show local account name when ENS is resolved'}</div>
          </div>

          <div className='signerPermission localSetting' style={{ zIndex: 206 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionSetting'>Colorway</div>
              <Dropdown
                syncValue={this.store('main.colorway')}
                onChange={(value) => link.send('tray:action', 'setColorway', value)}
                options={[
                  { text: 'Dark', value: 'dark' },
                  { text: 'Light', value: 'light' }
                ]}
              />
            </div>
            <div className='signerPermissionDetails'>
              <span>Set Frame's visual theme</span>
            </div>
          </div>

          <div className='signerPermission localSetting' style={{ zIndex: 205 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionSetting'>Trezor Derivation</div>
              <Dropdown
                syncValue={this.store('main.trezor.derivation')}
                onChange={(value) => link.send('tray:action', 'setTrezorDerivation', value)}
                options={[
                  { text: 'Standard', value: 'standard' },
                  { text: 'Legacy', value: 'legacy' },
                  { text: 'Testnet', value: 'testnet' }
                ]}
              />
            </div>
            <div className='signerPermissionDetails'>{'Derivation path for connected Trezor devices'}</div>
          </div>
          <div className='signerPermission localSetting' style={{ zIndex: 204 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionSetting'>Ledger Derivation</div>
              <Dropdown
                syncValue={this.store('main.ledger.derivation')}
                onChange={(value) => link.send('tray:action', 'setLedgerDerivation', value)}
                options={[
                  { text: 'Live', value: 'live' },
                  { text: 'Legacy', value: 'legacy' },
                  { text: 'Standard', value: 'standard' },
                  { text: 'Testnet', value: 'testnet' }
                ]}
              />
            </div>
            <div className='signerPermissionDetails'>{'Derivation path for connected Ledger devices'}</div>
          </div>
          {this.store('main.ledger.derivation') === 'live' ? (
            <div className='signerPermission localSetting' style={{ zIndex: 203 }}>
              <div className='signerPermissionControls'>
                <div className='signerPermissionSetting'>Ledger Live Accounts</div>
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
              <div className='signerPermissionDetails'>The number of live accounts to derive</div>
            </div>
          ) : null}
          <div className='signerPermission localSetting' style={{ zIndex: 202 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionSetting'>Lattice Derivation</div>
              <Dropdown
                syncValue={this.store('main.latticeSettings.derivation')}
                onChange={(value) => link.send('tray:action', 'setLatticeDerivation', value)}
                options={[
                  { text: 'Standard', value: 'standard' },
                  { text: 'Legacy', value: 'legacy' },
                  { text: 'Live', value: 'live' }
                ]}
              />
            </div>
            <div className='signerPermissionDetails'>{'Derivation path for connected Lattice devices'}</div>
          </div>
          <div className='signerPermission localSetting' style={{ zIndex: 201 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionSetting'>Lattice Accounts</div>
              <Dropdown
                syncValue={this.store('main.latticeSettings.accountLimit')}
                onChange={(value) => link.send('tray:action', 'setLatticeAccountLimit', value)}
                options={[
                  { text: '5', value: 5 },
                  { text: '10', value: 10 },
                  { text: '20', value: 20 },
                  { text: '40', value: 40 }
                ]}
              />
            </div>
            <div className='signerPermissionDetails'>The number of lattice accounts to derive</div>
          </div>
          <div className='signerPermission localSetting' style={{ zIndex: 200 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionSetting'>Lattice Relay</div>
              <Dropdown
                syncValue={this.store('main.latticeSettings.endpointMode')}
                onChange={(value) => {
                  link.send('tray:action', 'setLatticeEndpointMode', value)
                  this.setState({ latticeEndpointMode: value })
                }}
                options={[
                  { text: 'Default', value: 'default' },
                  { text: 'Custom', value: 'custom' }
                ]}
              />
            </div>
            <div
              className={
                this.state.latticeEndpointMode === 'custom'
                  ? 'connectionCustomInput connectionCustomInputOn'
                  : 'connectionCustomInput'
              }
            >
              <input
                tabIndex='-1'
                placeholder={'Custom Relay'}
                value={this.state.latticeEndpoint}
                onChange={(e) => this.inputLatticeEndpoint(e)}
              />
            </div>
          </div>

          <div className='signerPermission localSetting' style={{ zIndex: 199 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionSetting'>Lock Hot Signers on</div>
              <Dropdown
                syncValue={this.store('main.accountCloseLock')}
                onChange={(value) => link.send('tray:action', 'setAccountCloseLock', value)}
                options={[
                  { text: 'Close', value: true },
                  { text: 'Quit', value: false }
                ]}
              />
            </div>
            <div className='signerPermissionDetails'>When should Frame relock your hot signers?</div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Settings)
