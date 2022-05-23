import React, { createRef } from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
import svg from '../../../resources/svg'

// import Filter from '../Filter'

import Dropdown from '../../../resources/Components/Dropdown'

import Connection from './Connection'
import Gas from './Gas'
import Usage from './Usage'
import Tokens from './Tokens'

import chainMeta from '../../../resources/chainMeta'

class _SettingsModule extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.state = {
      expanded: false
    }
  }
  render () {
    
    const { id, name, type, explorer, symbol, layer, changed } = this.props
    const price = this.store('main.networksMeta.ethereum', id, 'nativeCurrency.usd.price') || '?'
    return (
      <div className='sliceContainer' ref={this.ref}>
        <div 
          className='sliceTile sliceTileClickable'
          onClick={() => {
            this.setState({ expanded: !this.state.expanded })
          }}
        >
          <div className='sliceChainId'>
            <div className='sliceChainIdIcon'>{svg.chain(12)}</div>
            <div className='sliceChainIdNumber'>{id}</div>
          </div>
          <div className='sliceChainId'>
            <div className='sliceChainIdIcon'>{symbol}</div>
            <div className='sliceChainIdNumber'>{price.toLocaleString()}</div>
          </div>
        </div>
        {this.state.expanded ? (
          <>
            <div className='chainConfig cardShow'>  
              <div className='chainConfigRow'>  
                <input
                  className='chainIdInput'
                  value={this.state.id} spellCheck='false'
                  onChange={(e) => {
                    if (type === 'ethereum' && id === 1) return
                    this.setState({ id: e.target.value })
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') this.setState({ id: this.props.id })
                  }}
                />
                <input
                  className='chainSymbolInput'
                  value={this.state.symbol} spellCheck='false'
                  onChange={(e) => {
                    if (type === 'ethereum' && id === 1) return
                    if (e.target.value.length > 8) return e.preventDefault()
                    this.setState({ symbol: e.target.value })
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') this.setState({ symbol: this.props.symbol })
                  }}
                />
                <Dropdown
                  syncValue={this.state.layer}
                  onChange={layer => this.setState({ layer })}
                  options={type === 'ethereum' && id === 1 ? [
                    { text: 'mainnet', value: 'mainnet'}
                  ] : [
                    { text: 'rollup', value: 'rollup'}, 
                    { text: 'sidechain', value: 'sidechain'}, 
                    { text: 'testnet', value: 'testnet'}, 
                    { text: 'other', value: 'other'}
                  ]}
                />
              </div>
              <div className='chainConfigRow'>
                <input
                  value={this.state.explorer} spellCheck='false'
                  onChange={(e) => {
                    this.setState({ explorer: e.target.value })
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') this.setState({ explorer: this.props.explorer })
                  }}
                />
              </div>
            </div>

            {type === 'ethereum' && id === 1 ? (
              <div className='chainMore cardShow'>
                <div className='moduleButton moduleButtonLocked'>
                  {svg.lock(11)}
                </div>
              </div>
            ) : (
              <div className='chainMore cardShow'>
                <div
                  className='moduleButton moduleButtonBad' onMouseDown={() => {
                    const { id, name, type, explorer } = this.props
                    link.send('tray:action', 'removeNetwork', { id, name, explorer, type })
                  }}
                >
                  {svg.trash(13)} 
                  <span>remove chain</span>
                </div>
              </div>
            )}

            {changed ? (
              <div className='chainConfigSave cardShow'>
                <div
                  className='moduleButton moduleButtonGood' onMouseDown={() => {
                    const net = { id: this.props.id, name: this.props.name, type: this.props.type, symbol: this.props.symbol, explorer: this.props.explorer, layer: this.props.layer }
                    const newNet = { id: this.state.id, name: this.state.name, type: this.state.type, symbol: this.state.symbol, explorer: this.state.explorer, layer: this.state.layer }
                    let empty = false
                    Object.keys(newNet).forEach(k => {
                      if (typeof newNet[k] === 'string') {
                        newNet[k] = newNet[k].trim()
                      }
                      if (newNet[k] === '') empty = true
                    })
                    if (empty) return
                    this.setState(newNet)
                    this.setState({ submitted: true })
                    link.send('tray:action', 'updateNetwork', net, newNet)
                    setTimeout(() => this.setState({ submitted: false }), 1600)
                  }}>
                    {svg.save(11)} <span> save changes</span>
                  </div>
                </div>
              ) : (this.state.submitted ? (
                <div className='chainConfigSave'>
                  <div className='moduleButton'>
                    {svg.octicon('check', { height: 22 })}
                  </div>
                </div>
              ) : null
            )}
          </>
        ) : null}
      </div>
    )
  }
}

const SettingsModule = Restore.connect(_SettingsModule)


// class _FeeModule extends React.Component {
//   constructor (props, context) {
//     super(props, context)
//     this.state = {
//       expanded: false
//     }
//   }
//   renderCloseBars () {
//     return (
//       <div 
//       className='sliceContainerClose'
//       onClick={() => {
//         this.setState({ expanded: false })
//       }}
//     >
//       {svg.chevron(12)}
//       {svg.chevron(12)}
//       {svg.chevron(12)}
//       {svg.chevron(12)}
//       {svg.chevron(12)}
//       {svg.chevron(12)}
//       {svg.chevron(12)}
//     </div>
//     )
//   }
//   render () {
//     const { id } = this.props
//     const gas = Math.round(parseInt(this.store('main.networksMeta.ethereum', id, 'gas.price.levels.fast'), 'hex') / 1e9) || '---'
//     const price = this.store('main.networksMeta.ethereum', id, 'nativeCurrency.usd.price') || '---'
//     const change24hr = this.store('main.networksMeta.ethereum', id, 'nativeCurrency.usd.change24hr') || '---'
//     const symbol = this.store('main.networks.ethereum', id, 'symbol') || '---'

//     return (
//       <div className='sliceContainer' ref={this.ref}>
//         <div 
//           className={this.state.expanded ? 'sliceTile sliceTileHighlight' : 'sliceTile'}
//           onClick={() => {
//             this.setState({ expanded: !this.state.expanded })
//           }}
//         >
//           <div>{`${gas} Gwei`}</div>
//         </div>
//         {this.state.expanded ? (
//           <>
//             {this.renderCloseBars()}
//             <div className='sliceTile'>{'hello'}</div>
//           </>
//         ) : null}
//       </div>
//     )
//   }
// }

// const FeeModule = Restore.connect(_FeeModule)


class _ChainModule extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      expanded: false
    }
    this.ref = createRef()
  }

  // clickHandler (e) {
  //   if (!e.composedPath().includes(this.ref.current)) {
  //     if (this.state.expanded) this.setState({ expanded: false })
  //   }
  // }

  // componentDidMount () {
  //   document.addEventListener('click', this.clickHandler.bind(this))
  // }

  // componentDidUnmount () {
  //   document.removeEventListener('click', this.clickHandler.bind(this))
  // }

  renderConnection (origin, id) {
    return (
      <div 
        className='sliceTile sliceTileClickable'
        onClick={() => {
          this.setState({ expanded: !this.state.expanded })
        }}
      >
        <div className={this.props.active ? 'sliceTileIndicatorLarge sliceTileIndicatorActive' : 'sliceTileIndicatorLarge' } />
        <div className='sliceTileConnectionName'> 
          {'Pylon'}
        </div>
        <div className='sliceTileBlock'>
          <div className='sliceTileBlockIcon'>{svg.chain(16)}</div>
          <div className='sliceTileChainId'>{id}</div>
          <div className='sliceTileBlockIcon'>{svg.cube(16)}</div>
          <div>{1223434}</div>
        </div>
      </div>
    )
  }
  status (type, id, layer) {
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
    if (!this.store('main.networks', type, id, 'on')) status = 'off'

    return (
      <div className='connectionOptionStatus'>
        {this.indicator(status)}
        <div className='connectionOptionStatusText'>{status}</div>
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
    const { id, type, connection, changed } = this.props

    const networkPresets = this.store('main.networkPresets', type)
    let presets = networkPresets[id] || {}
    presets = Object.keys(presets).map(i => ({ text: i, value: type + ':' + id + ':' + i }))
    presets = presets.concat(Object.keys(networkPresets.default).map(i => ({ text: i, value: type + ':' + id + ':' + i })))
    presets.push({ text: 'Custom', value: type + ':' + id + ':' + 'custom' })

    return (
      <div className='sliceContainer' ref={this.ref}>
        {this.renderConnection('connection', id)}
        {this.state.expanded ? (
          <div className='connectionLevels'>
            <div className='signerPermission signerPermissionNetwork cardShow' style={{ zIndex: 2 }}>
              <div className={connection.primary.on ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
                <div className='connectionOptionToggle'>
                  <div className='signerPermissionSetting'>Primary</div>
                  <div className={connection.primary.on ? 'signerPermissionToggleSmall signerPermissionToggleSmallOn' : 'signerPermissionToggleSmall'} onMouseDown={_ => link.send('tray:action', 'toggleConnection', type, id, 'primary')}>
                    <div className='signerPermissionToggleSwitch' />
                  </div>
                </div>
                {connection.primary.on ? (
                  <>
                    <div className='connectionOptionDetails cardShow'>
                      <div className='connectionOptionDetailsInset'>
                        {this.status(type, id, 'primary')}
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
                    <div className={connection.primary.current === 'custom' && connection.primary.on ? 'connectionCustomInput connectionCustomInputOn cardShow' : 'connectionCustomInput'}>
                      <input 
                        className='customInput'
                        tabIndex='-1'
                        value={this.state.primaryCustom}
                        onFocus={() => this.customPrimaryFocus()} 
                        onBlur={() => this.customPrimaryBlur()}
                        onChange={e => this.inputPrimaryCustom(e)}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            <div className='signerPermission signerPermissionNetwork cardShow' style={{ zIndex: 1 }}>
              <div className={connection.secondary.on ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
                <div className='connectionOptionToggle'>
                  <div className='signerPermissionSetting'>Secondary</div>
                  <div className={connection.secondary.on ? 'signerPermissionToggleSmall signerPermissionToggleSmallOn' : 'signerPermissionToggleSmall'} onMouseDown={_ => link.send('tray:action', 'toggleConnection', type, id, 'secondary')}>
                    <div className='signerPermissionToggleSwitch' />
                  </div>
                </div>
                {connection.secondary.on ? (
                  <>
                    <div className='connectionOptionDetails cardShow'>
                      <div className='connectionOptionDetailsInset'>
                        {this.status(type, id, 'secondary')}
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
                    <div className={connection.secondary.current === 'custom' && connection.secondary.on ? 'connectionCustomInput connectionCustomInputOn cardShow' : 'connectionCustomInput'}>
                      <input tabIndex='-1' value={this.state.secondaryCustom} onFocus={() => this.customSecondaryFocus()} onBlur={() => this.customSecondaryBlur()} onChange={e => this.inputSecondaryCustom(e)} />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>   
        ) : null}
      </div>
    )
  }
}

const ChainModule = Restore.connect(_ChainModule)





class _Network extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.customMessage = 'Custom Endpoint'
    const { id, name, type, explorer, symbol, layer } = this.props
    this.network = id
    this.networkType = type
    const primaryCustom = context.store('main.networks', this.networkType, this.network, 'connection.primary.custom') || this.customMessage
    const secondaryCustom = context.store('main.networks', this.networkType, this.network, 'connection.secondary.custom') || this.customMessage
    this.newNetworkIdDefault = 'ID'
    this.newNetworkNameDefault = 'New Network'
    this.newNetworkExplorerDefault = 'Block Explorer'
    this.newNetworkSymbolDefault = 'ETH'
    this.newNetworkType = 'ethereum'
    this.state = {
      id, 
      name, 
      explorer, 
      type, 
      symbol, 
      layer,
      submitted: false, 
      newNetworkId: this.newNetworkIdDefault,
      newNetworkName: this.newNetworkNameDefault,
      newNetworkExplorer: this.newNetworkExplorerDefault,
      newNetworkSymbol: this.newNetworkSymbolDefault,
      newNetworkType: this.newNetworkType,
      localShake: {}, 
      primaryCustom, 
      secondaryCustom, 
      resetConfirm: false, 
      expandNetwork: false,
      showControls: false,
    }
 }

  okProtocol (location) {
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

  inputPrimaryCustom (e) {
    e.preventDefault()
    clearTimeout(this.customPrimaryInputTimeout)
    const value = e.target.value.replace(/\s+/g, '')
    this.setState({ primaryCustom: value })
    this.customPrimaryInputTimeout = setTimeout(() => link.send('tray:action', 'setPrimaryCustom', this.props.type, this.props.id, this.state.primaryCustom), 1000)
  }

  inputSecondaryCustom (e) {
    e.preventDefault()
    clearTimeout(this.customSecondaryInputTimeout)
    const value = e.target.value.replace(/\s+/g, '')
    this.setState({ secondaryCustom: value })
    this.customSecondaryInputTimeout = setTimeout(() => link.send('tray:action', 'setSecondaryCustom', this.props.type, this.props.id, this.state.secondaryCustom), 1000)
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

  // status (type, id, layer) {
  //   const connection = this.store('main.networks', type, id, 'connection', layer)
  //   let status = connection.status
  //   const current = connection.current

  //   if (current === 'custom') {
  //     if (layer === 'primary' && this.state.primaryCustom !== '' && this.state.primaryCustom !== this.customMessage) {
  //       if (!this.okProtocol(this.state.primaryCustom)) status = 'invalid target'
  //       else if (!this.okPort(this.state.primaryCustom)) status = 'invalid port'
  //     }

  //     if (layer === 'secondary' && this.state.secondaryCustom !== '' && this.state.secondaryCustom !== this.customMessage) {
  //       if (!this.okProtocol(this.state.secondaryCustom)) status = 'invalid target'
  //       else if (!this.okPort(this.state.secondaryCustom)) status = 'invalid port'
  //     }
  //   }
  //   if (status === 'connected' && !connection.network) status = 'loading'
  //   if (!this.store('main.networks', type, id, 'on')) status = 'off'

  //   return (
  //     <div className='connectionOptionStatus'>
  //       {this.indicator(status)}
  //       <div className='connectionOptionStatusText'>{status}</div>
  //     </div>
  //   )
  // }

  // indicator (status) {
  //   if (status === 'connected') {
  //     return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorGood' /></div>
  //   } else if (status === 'loading' || status === 'syncing' || status === 'pending' || status === 'standby') {
  //     return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorPending' /></div>
  //   } else {
  //     return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorBad' /></div>
  //   }
  // }

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

  render () {
    const changed = (
      this.state.id && 
      this.state.name && 
      this.state.symbol && 
      this.state.explorer && 
      this.state.type &&
      this.state.layer && (
        this.props.id !== this.state.id ||
        this.props.name !== this.state.name ||
        this.props.symbol !== this.state.symbol ||
        this.props.explorer !== this.state.explorer ||
        this.props.type !== this.state.type || 
        this.props.layer !== this.state.layer
      )
    )
    const { id, type, connection, filter } = this.props

    const networkPresets = this.store('main.networkPresets', type)
    let presets = networkPresets[id] || {}
    presets = Object.keys(presets).map(i => ({ text: i, value: type + ':' + id + ':' + i }))
    presets = presets.concat(Object.keys(networkPresets.default).map(i => ({ text: i, value: type + ':' + id + ':' + i })))
    presets.push({ text: 'Custom', value: type + ':' + id + ':' + 'custom' })

    const gas = Math.round(parseInt(this.store('main.networksMeta.ethereum', this.state.id, 'gas.price.levels.fast'), 'hex') / 1e9) || '---'
    const price = this.store('main.networksMeta.ethereum', this.state.id, 'nativeCurrency.usd.price') || '?'
    const change24hr = this.store('main.networksMeta.ethereum', this.state.id, 'nativeCurrency.usd.change24hr') || '?'
    const symbol = this.store('main.networks.ethereum', this.state.id, 'symbol') || '?'

    const hexId = '0x' + parseInt(id).toString('16')

    if (
      filter &&
      !this.state.id.toString().includes(filter) && 
      !this.state.name.includes(filter) && 
      !this.state.symbol.includes(filter) && 
      !this.state.explorer.includes(filter) && 
      !this.state.type.includes(filter) &&
      !this.state.layer.includes(filter)
    ) return null

    return (
      <div className='network'>
        <div className='networkActive'>
          {chainMeta[hexId] && chainMeta[hexId].icon ? (
            <div 
              className='chainBadge'
              style={{ background: chainMeta[hexId] ? chainMeta[hexId].primaryColor : '' }}
            >
              <img src={chainMeta[hexId].icon} />
            </div>
          ) : (
            <div 
              className='chainBadge'
              style={{ background: chainMeta[hexId] ? chainMeta[hexId].primaryColor : '' }}
            />
          )}
          <div className='networkName'>
            {this.state.name}
            {/* <input
              value={this.state.name} spellCheck='false'
              onChange={(e) => {
                this.setState({ name: e.target.value })
              }}
              onBlur={(e) => {
                if (e.target.value === '') this.setState({ name: this.props.name })
              }}
            /> */}
          </div>

          {/* <div className='chainIdBadgeBackground' /> */}

          <div className='chainSettings' onClick={() => {
            alert('show chain settings')
          }}>
            {svg.gear(11)}
          </div>
          <div 
            className={this.props.on ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} 
            onClick={this.props.id !== 1 ? () => {
              link.send('tray:action', 'activateNetwork', type, id, !this.props.on)
            } : null}
          >
            {this.props.id === 1 ? (
              <div className='signerPermissionToggleSwitchLocked'>
                {svg.lock(10)}
                <div className='signerPermissionToggleSwitch' />
              </div>
            ) : (
              <div className='signerPermissionToggleSwitch' />
            )}
          </div>
        </div>
        {this.props.on ? (
          <div className='chainModules'>
            <Connection changed={changed} {...this.props} />
            <Gas id={this.props.id} /> 
            {/* <Usage changed={changed} {...this.props} />
            <Tokens changed={changed} {...this.props} /> */}
            <div className='chainFooter'>
              <div className='chainCurrencyItem'>
                <div className='chainCurrencyItemSymbol'>{symbol}</div>
                <div className='chainCurrencyItemAt'>{'@'}</div>
                <div className='sliceChainIdNumber'>{'$' + price.toLocaleString() + ''}</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    )
  }
}

const Network = Restore.connect(_Network)


class Settings extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.customMessage = 'Custom Endpoint'
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
    this.newNetworkIdDefault = 'ID'
    this.newNetworkNameDefault = 'New Network'
    this.newNetworkExplorerDefault = 'Block Explorer'
    this.newNetworkSymbolDefault = 'ETH'
    this.newNetworkType = 'ethereum'
    this.state = {
      newNetworkId: this.newNetworkIdDefault,
      newNetworkName: this.newNetworkNameDefault,
      newNetworkExplorer: this.newNetworkExplorerDefault,
      newNetworkSymbol: this.newNetworkSymbolDefault,
      newNetworkType: this.newNetworkType,
      localShake: {},
      resetConfirm: false, 
      expandNetwork: false,
      findFocus: false, 
      findHover: false,
      findInput: ''
    }
  }

  discord () {
    return (
      <div className='discordInvite' onMouseDown={() => link.send('tray:action', 'navDash', { view: 'openExternal', data: { notify: 'hotAccountWarning', notifyData: { url: 'https://discord.gg/UH7NGqY' }}})}>
        <div>Need help?</div>
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

  selectNetwork (network) {
    const [type, id] = network.split(':')
    if (network.type !== type || network.id !== id) link.send('tray:action', 'selectNetwork', type, id)
  }

  // expandNetwork (e, expand) {
  //   e.stopPropagation()
  //   this.setState({ expandNetwork: expand !== undefined ? expand : !this.state.expandNetwork })
  // }

  renderConnections (layer) {
    const nets = []
    const networks = this.store('main.networks')

    const { filter } = this.state

    Object.keys(networks).forEach(type => {
      nets.push(
        <div key={type}>
          {Object.keys(networks[type])
            .map(id => parseInt(id))
            .sort((a, b) => a - b)
            .filter(id => {
              if (!networks[type][id].layer && layer === 'other') return true
              return networks[type][id].layer === layer
            }).map(id => {
              return <Network
                key={type + id}
                id={id}
                name={networks[type][id].name}
                symbol={networks[type][id].symbol}
                explorer={networks[type][id].explorer}
                type={type}
                connection={networks[type][id].connection}
                layer={networks[type][id].layer}
                on={networks[type][id].on}
                filter={filter}
              />
            })
          }
        </div>
      )
    })
    return nets
  }

  render () {
    const { type, id } = { type: 'ethereum', id: 1 }// TODO: this.store('main.currentNetwork')
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
    const { findHover, findFocus, findInput } = this.state
    console.log( findHover, findFocus, findInput )
    return (
      <div className={'localSettings cardShow'}>
        {/* <div 
          className='chainFilter'
          style={findHover || findFocus || findInput ? {
            transform: `translateY(0px)`
          } : null}
          onMouseEnter={() => {
            this.setState({ findHover: true })
          }}
          onMouseLeave={() => {
            this.setState({ findHover: false })
          }}
        >
          <div className='chainFilterTitle'>
            {'Find'}
          </div>
          <div className='chainFilterInput'>
            <input 
              value={findInput}
              tabIndex='-1'
              onMouseEnter={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!findInput) e.target.focus({ preventScroll: true })
              }}
              onFocus={() => {
                this.setState({ findFocus: true })
              }}
              onBlur={() => {
                this.setState({ findFocus: false })
              }}
              onChange={(e) => {
                this.setState({ findInput: e.target.value })
              }}
            />
          </div>
        </div> */}
        <div className='localSettingsWrap'>
          <div className='newAccount' onClick={() => link.send('tray:action', 'navDash', { view: 'accounts', data: { showAddAccounts: true } })}>
            <div className='newAccountIcon'>{svg.plus(16)}</div> 
            Add New Chain
          </div>
          {this.renderConnections('mainnet')}
          <div className='networkBreak'>
            <div className='networkBreakLayer'>Rollups</div>
          </div>
          {this.renderConnections('rollup')}
          <div className='networkBreak'>
            <div className='networkBreakLayer'>Sidechains</div>
          </div>
          {this.renderConnections('sidechain')}
          <div className='networkBreak'>
            <div className='networkBreakLayer'>Testnets</div>
          </div>
          {this.renderConnections('testnet')}
          <div className='networkBreak'>
            <div className='networkBreakLayer'>Other</div>
          </div>
          {this.renderConnections('other')}
          {this.discord()}
        </div>
      </div>
    )
  }
}

export default Restore.connect(Settings)
