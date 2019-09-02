import React from 'react'
import Restore from 'react-restore'
import link from '../../../link'
import Client from '../Client'

import Dropdown from '../../Components/Dropdown'

class Settings extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.customMessage = 'Custom Endpoint'
    this.network = context.store('main.connection.network')
    const secondaryCustom = context.store('main.connection.secondary.settings', this.network, 'options.custom') || this.customMessage
    this.state = { localShake: {}, secondaryCustom, resetConfirm: false, expandNetwork: false }
    context.store.observer(() => {
      if (this.network !== context.store('main.connection.network')) {
        this.network = context.store('main.connection.network')
        const secondaryCustom = context.store('main.connection.secondary.settings', this.network, 'options.custom') || this.customMessage
        this.setState({ secondaryCustom })
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
    const value = e.target.value
    this.setState({ secondaryCustom: value })
    this.customInputTimeout = setTimeout(() => link.send('tray:action', 'setSecondaryCustom', this.state.secondaryCustom), 1000)
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

  status (connection) {
    let status = connection.status
    const network = this.store('main.connection.network')
    const current = connection.settings[network].current
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

  selectNetwork (network) {
    if (network !== this.store('main.connection.network')) {
      link.send('tray:action', 'selectNetwork', network)
    }
  }

  expandNetwork (e, expand) {
    e.stopPropagation()
    this.setState({ expandNetwork: expand !== undefined ? expand : !this.state.expandNetwork })
  }

  render () {
    return (
      <div className={this.store('panel.view') !== 'settings' ? 'localSettings localSettingsHidden' : 'localSettings'} onMouseDown={e => this.expandNetwork(e, false)}>
        <div className='localSettingsWrapFadeTop' />
        <div className='localSettingsWrapFadeBot' />
        <div className='localSettingsWrap'>
          <div className='localSettingsTitle connectionTitle'>
            <div>{'Connection'}</div>
            <Dropdown
              syncValue={this.store('main.connection.network')}
              onChange={(network) => this.selectNetwork(network)}
              options={[
                { text: 'Mainnet', value: '1' },
                { text: 'Ropsten', value: '3' },
                { text: 'Rinkeby', value: '4' },
                { text: 'Kovan', value: '42' }]}
            />
          </div>
          <div className='signerPermission'>
            <div className={this.store('main.connection.local.on') ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
              <div className='connectionOptionToggle'>
                <div className='signerPermissionOrigin'>{'Local'}</div>
                <div className={this.store('main.connection.local.on') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => link.send('tray:action', 'toggleConnection', 'local')}>
                  <div className='signerPermissionToggleSwitch' />
                </div>
              </div>
              <div className='connectionOptionDetails'>
                <div className='connectionOptionDetailsInset'>
                  {this.status(this.store('main.connection.local'))}
                  <div className='signerOptionSetWrap'>
                    <div className={this.state.localShake.custom ? 'signerOptionSet headShake' : 'signerOptionSet'} onMouseDown={() => this.localShake('custom')}>
                      <div className='signerOptionSetButton' />
                      {this.store('main.connection.local.type') ? (
                        <div className='signerOptionSetText'>{this.store('main.connection.local.type')}</div>
                      ) : (_ => {
                        const status = this.store('main.connection.local.status')
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
            <div className={this.store('main.connection.secondary.on') ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
              <div className='connectionOptionToggle'>
                <div className='signerPermissionOrigin'>{'Secondary'}</div>
                <div className={this.store('main.connection.secondary.on') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => link.send('tray:action', 'toggleConnection', 'secondary')}>
                  <div className='signerPermissionToggleSwitch' />
                </div>
              </div>
              <div className='connectionOptionDetails'>
                <div className='connectionOptionDetailsInset'>
                  {this.status(this.store('main.connection.secondary'))}
                  <Dropdown
                    syncValue={this.store('main.connection.secondary.settings', this.store('main.connection.network'), 'current')}
                    onChange={(value) => link.send('tray:action', 'selectSecondary', value)}
                    options={[
                      { text: 'Infura', value: 'infura' },
                      { text: 'Custom', value: 'custom' }
                    ]}
                  />
                </div>
              </div>

              <div className={this.store('main.connection.secondary.settings', this.store('main.connection.network'), 'current') === 'custom' && this.store('main.connection.secondary.on') ? 'connectionCustomInput connectionCustomInputOn' : 'connectionCustomInput'}>
                <input tabIndex='-1' value={this.state.secondaryCustom} onFocus={() => this.customFocus()} onBlur={() => this.customBlur()} onChange={e => this.inputCustom(e)} />
              </div>
            </div>
          </div>
          {/* Local clients */}
          <div className='localSettingsTitle connectionTitle'>
            <div>{'Local Clients'}</div>
          </div>
          <Client client='parity' />
          <Client client='ipfs' />

          <div className='localSettingsTitle'>{'Settings'}</div>
          <div className='signerPermission'>
            <div className='signerPermissionControls'>
              <div className='signerPermissionOrigin'>{'Run on Startup'}</div>
              <div className={this.store('main.launch') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => link.send('tray:action', 'toggleLaunch')}>
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>
              {'Run Frame when your computer starts'}
            </div>
          </div>
          <div className='signerPermission'>
            <div className='signerPermissionControls'>
              <div className='signerPermissionOrigin'>{'Glide'}</div>
              <div className={this.store('main.reveal') ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} onMouseDown={_ => link.send('tray:action', 'toggleReveal')}>
                <div className='signerPermissionToggleSwitch' />
              </div>
            </div>
            <div className='signerPermissionDetails'>
              {'Mouse to the middle of your display\'s right edge to reveal Frame'}
            </div>
          </div>
          <div className='signerPermission'>
            <div className='signerPermissionControls'>
              <div className='signerPermissionOrigin'>{'Ledger Derivation Path'}</div>
              <Dropdown
                syncValue={this.store('main.ledger.derivation')}
                onChange={(value) => link.send('tray:action', 'setLedgerDerivation', value)}
                options={[{ text: 'Legacy', value: 'legacy' }, { text: 'Live', value: 'live' }]}
              />
            </div>
            <div className='signerPermissionDetails'>
              {`Use Ledger's Legacy or Live derivation path`}
            </div>
          </div>
          {this.quit()}
          <div className='viewLicense' onMouseDown={() => this.store.notify('openExternal', { url: 'https://github.com/floating/frame/blob/master/LICENSE' })}>{'View License'}</div>
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
