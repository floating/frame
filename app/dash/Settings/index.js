import React, { Component } from 'react'
import Restore from 'react-restore'
import hotkeys from 'hotkeys-js'

import link from '../../../resources/link'
import Dropdown from '../../../resources/Components/Dropdown'
import { getShortcutFromKeyEvent, getDisplayShortcut, isDisabledKey } from '../../../resources/app'

class Settings extends Component {
  constructor(props, context) {
    super(props, context)
    const latticeEndpoint = context.store('main.latticeSettings.endpointCustom')
    const latticeEndpointMode = context.store('main.latticeSettings.endpointMode')
    this.state = {
      configureShortcut: false,
      latticeEndpoint,
      latticeEndpointMode,
      resetConfirm: false
    }
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

  render() {
    const summonShortcut = this.store('main.shortcuts.summon')
    const platform = this.store('platform')
    const { modifierKeys: summonModifierKeys, shortcutKey: summonShortcutKey } = getDisplayShortcut(
      platform,
      summonShortcut
    )
    hotkeys.unbind()
    if (this.state.configureShortcut) {
      // disable existing shortcut whilst configuring a new one
      link.send('tray:action', 'setShortcut', 'summon', {
        ...summonShortcut,
        enabled: false
      })
      hotkeys('*', { capture: true }, (event) => {
        event.preventDefault()
        const modifierKeys = ['Meta', 'Alt', 'Shift', 'Control', 'Command']
        const isModifierKey = modifierKeys.includes(event.key)

        // ignore modifier key solo keypresses and disabled keys
        if (!isModifierKey && !isDisabledKey(event, platform)) {
          this.setState({
            configureShortcut: false
          })
          const shortcut = getShortcutFromKeyEvent(event)
          // enable new shortcut
          link.send('tray:action', 'setShortcut', 'summon', { ...shortcut, enabled: true })
        }

        return false
      })
    }
    return (
      <div className={'localSettings cardShow'}>
        <div className='localSettingsWrap'>
          <div className='signerPermission localSetting' style={{ zIndex: 214 }}>
            <div className='signerPermissionControls'>
              <div className='signerPermissionSetting'>Summon Shortcut</div>
              <div
                className={
                  summonShortcut.enabled
                    ? 'signerPermissionToggle signerPermissionToggleOn'
                    : 'signerPermissionToggle'
                }
                onClick={() => {
                  link.send('tray:action', 'setShortcut', 'summon', {
                    ...summonShortcut,
                    enabled: !summonShortcut.enabled
                  })
                }}
              >
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>
              <span>
                Summon Frame by pressing
                {this.state.configureShortcut ? (
                  <></>
                ) : (
                  <span
                    className='keyCommand'
                    onClick={() => {
                      this.setState({
                        configureShortcut: true
                      })
                    }}
                  >
                    {[...summonModifierKeys, summonShortcutKey].map((displayKey, index, displayKeys) =>
                      index === displayKeys.length - 1 ? (
                        displayKey
                      ) : (
                        <span key={index}>
                          {displayKey}
                          <span style={{ padding: '0px 3px' }}>+</span>
                        </span>
                      )
                    )}
                  </span>
                )}
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
                onClick={() => link.send('tray:action', 'setAutohide', !this.store('main.autohide'))}
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
                onClick={() => link.send('tray:action', 'toggleLaunch')}
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
                onClick={() => link.send('tray:action', 'toggleReveal')}
              >
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>{"Mouse to display's right edge to summon Frame"}</div>
          </div>

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
                  onClick={() =>
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
                onClick={() =>
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
              <span>Set Frame&apos;s visual theme</span>
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
