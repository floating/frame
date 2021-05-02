import React from 'react'
import Restore from 'react-restore'
import link from '../../../../resources/link'
import svg from '../../../../resources/svg'
// import Client from '../Client'

import Dropdown from '../../Components/Dropdown'

// <Network key={type + id} id={id} name={networks[type][id].name} symbol={networks[type][id].symbol} explorer={networks[type][id].explorer} type={type} />


// import React from 'react'
// import Restore from 'react-restore'

// import svg from '../../../../../resources/svg'
// import link from '../../../../../resources/link'

class _Network extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.customMessage = 'Custom Endpoint'
    this.network = context.store('main.currentNetwork.id')
    this.networkType = context.store('main.currentNetwork.type')
    const primaryCustom = context.store('main.networks', this.networkType, this.network, 'connection.primary.custom') || this.customMessage
    const secondaryCustom = context.store('main.networks', this.networkType, this.network, 'connection.secondary.custom') || this.customMessage
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
    const { id, name, type, explorer, symbol } = this.props
    // this.state = { }
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
      expandNetwork: false 
    }
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

  indicator (status) {
    if (status === 'connected') {
      return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorGood' /></div>
    } else if (status === 'loading' || status === 'syncing' || status === 'pending' || status === 'standby') {
      return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorPending' /></div>
    } else {
      return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorBad' /></div>
    }
  }

  customSecondaryFocus () {
    if (this.state.secondaryCustom === this.customMessage) this.setState({ secondaryCustom: '' })
  }

  customSecondaryBlur () {
    if (this.state.secondaryCustom === '') this.setState({ secondaryCustom: this.customMessage })
  }

  render () {
    const changed = (
      this.props.id !== this.state.id ||
      this.props.name !== this.state.name ||
      this.props.symbol !== this.state.symbol ||
      this.props.explorer !== this.state.explorer ||
      this.props.type !== this.state.type
    )
    const { id, type, connection } = this.props

    const networkPresets = this.store('main.networkPresets', type)
    let presets = networkPresets[id] || {}
    presets = Object.keys(presets).map(i => ({ text: i, value: type + ':' + id + ':' + i }))
    presets = presets.concat(Object.keys(networkPresets.default).map(i => ({ text: i, value: type + ':' + id + ':' + i })))
    presets.push({ text: 'Custom', value: type + ':' + id + ':' + 'custom' })

    return (
      <div className='network'>
        <div className='phaseNetworkLine'>
          {changed ? (
            <div
              className='phaseNetworkSubmit phaseNetworkSubmitEnabled' onMouseDown={() => {
                const net = { id: this.props.id, name: this.props.name, type: this.props.type, symbol: this.props.symbol, explorer: this.props.explorer }
                const newNet = { id: this.state.id, name: this.state.name, type: this.state.type, symbol: this.state.symbol, explorer: this.state.explorer }
                this.setState({ submitted: true })
                link.send('tray:action', 'updateNetwork', net, newNet)
                setTimeout(() => this.setState({ submitted: false }), 1600)
              }}
            >
              {svg.save(16)}
            </div>
          ) : (this.state.submitted ? (
            <div className='phaseNetworkSubmit phaseNetworkSubmitted'>
              {svg.octicon('check', { height: 22 })}
            </div>
          ) : (
            <div
              className='phaseNetworkSubmit phaseNetworkRemove' onMouseDown={() => {
                const { id, name, type, explorer } = this.props
                link.send('tray:action', 'removeNetwork', { id, name, explorer, type })
              }}
            >
              {svg.trash(16)}
            </div>
          )
          )}
          <div className='phaseNetworkName'>
            <input
              value={this.state.name} spellCheck='false'
              onChange={(e) => {
                this.setState({ name: e.target.value })
              }}
              onBlur={(e) => {
                if (e.target.value === '') this.setState({ name: this.props.name })
              }}
            />
          </div>
          <div className='phaseNetworkSymbol'>
            <input
              value={this.state.symbol} spellCheck='false'
              onChange={(e) => {
                if (e.target.value.length > 8) return e.preventDefault()
                this.setState({ symbol: e.target.value })
              }}
              onBlur={(e) => {
                if (e.target.value === '') this.setState({ symbol: this.props.symbol })
              }}
            />
          </div>
          <div className='phaseNetworkId'>
            <input
              value={this.state.id} spellCheck='false'
              onChange={(e) => {
                this.setState({ id: e.target.value })
              }}
              onBlur={(e) => {
                if (e.target.value === '') this.setState({ id: this.props.id })
              }}
            />
          </div>
          <div className='phaseNetworkExplorer'>
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
      </div>
    )
  }
}

const Network = Restore.connect(_Network)

// class NetworkWrap extends React.Component {
//   constructor (...args) {
//     super(...args)
//     this.newNetworkIdDefault = 'ID'
//     this.newNetworkNameDefault = 'New Network'
//     this.newNetworkExplorerDefault = 'Block Explorer'
//     this.newNetworkSymbolDefault = 'Ξ'
//     this.newNetworkType = 'ethereum'
//     this.state = {
//       newNetworkId: this.newNetworkIdDefault,
//       newNetworkName: this.newNetworkNameDefault,
//       newNetworkExplorer: this.newNetworkExplorerDefault,
//       newNetworkSymbol: this.newNetworkSymbolDefault,
//       newNetworkType: this.newNetworkType
//     }
//   }

//   renderNetworks () {
//     const networks = this.store('main.networks')
//     const nets = []
//     Object.keys(networks).forEach(type => {
//       nets.push(
//         <div key={type}>
//           {type === 'ethereum' ? (
//             <div className='phaseHeader'>
//               <div className='phaseHeaderText'>
//                 <div className='phaseHeaderIcon'>{svg.ethereum(20)}</div>
//                 Ethereum Networks
//               </div>
//             </div>
//           ) : (
//             <div className='phaseHeader'>
//               Unknown Networks
//             </div>
//           )}
//           {Object.keys(networks[type]).sort((a, b) => {
//             return parseInt(a) - parseInt(b)
//           }).map(id => {
//             return <Network key={type + id} id={id} name={networks[type][id].name} symbol={networks[type][id].symbol} explorer={networks[type][id].explorer} type={type} />
//           })}
//         </div>
//       )
//     })
//     return nets
//   }

//   render () {
//     const changedNewNetwork = (
//       this.state.newNetworkId !== this.newNetworkIdDefault ||
//       this.state.newNetworkName !== this.newNetworkNameDefault ||
//       this.state.newNetworkExplorer !== this.newNetworkExplorerDefault ||
//       this.state.newNetworkSymbol !== this.newNetworkSymbolDefault
//     )

//     const newNetworkReady = (
//       this.state.newNetworkId !== this.newNetworkIdDefault && this.state.newNetworkId !== '' &&
//       this.state.newNetworkName !== this.newNetworkNameDefault && this.state.newNetworkName !== '' &&
//       this.state.newNetworkExplorer !== this.newNetworkExplorerDefault && this.state.newNetworkExplorer !== ''
//     )

//     return (
//       <div className='phaseMainInner'>
//         <div className='phaseTitle'>Networks</div>
//         <div className='phaseBreak' />
//         <div className='phaseSubtitle'>Add, edit or remove networks</div>
//         <div className='phaseBreak' />
//         <div className='phaseNetwork'>
//           {this.renderNetworks()}
//           <div className='phaseBreak' style={{ margin: '13px 0px 11px 0px' }} />
//           <div className='phaseNetworkLine phaseNetworkCreate'>
//             {changedNewNetwork && newNetworkReady ? (
//               <div
//                 className='phaseNetworkSubmit phaseNetworkSubmitEnabled' onMouseDown={() => {
//                   const net = {
//                     id: this.state.newNetworkId,
//                     name: this.state.newNetworkName,
//                     type: this.state.newNetworkType,
//                     explorer: this.state.newNetworkExplorer,
//                     symbol: this.state.newNetworkSymbol
//                   }
//                   link.send('tray:action', 'addNetwork', net)
//                   this.setState({
//                     newNetworkId: this.newNetworkIdDefault,
//                     newNetworkName: this.newNetworkNameDefault,
//                     newNetworkExplorer: this.newNetworkExplorerDefault,
//                     newNetworkSymbol: this.newNetworkSymbolDefault
//                   })
//                 }}
//               >
//                 {svg.save(16)}
//               </div>
//             ) : (
//               <div className='phaseNetworkSubmit'>
//                 {svg.octicon('plus', { height: 17 })}
//               </div>
//             )}
//             <div className='phaseNetworkName'>
//               <input
//                 value={this.state.newNetworkName} spellCheck='false'
//                 onChange={(e) => {
//                   this.setState({ newNetworkName: e.target.value })
//                 }}
//                 onFocus={(e) => {
//                   if (e.target.value === this.newNetworkNameDefault) this.setState({ newNetworkName: '' })
//                 }}
//                 onBlur={(e) => {
//                   if (e.target.value === '') this.setState({ newNetworkName: this.newNetworkNameDefault })
//                 }}
//               />
//             </div>
//             <div className='phaseNetworkId'>
//               <input
//                 value={this.state.newNetworkId} spellCheck='false'
//                 onChange={(e) => {
//                   if (Number(parseInt(e.target.value)) || e.target.value === '') {
//                     this.setState({ newNetworkId: e.target.value })
//                   }
//                 }}
//                 onFocus={(e) => {
//                   if (e.target.value === this.newNetworkIdDefault) this.setState({ newNetworkId: '' })
//                 }}
//                 onBlur={(e) => {
//                   if (e.target.value === '') this.setState({ newNetworkId: this.newNetworkIdDefault })
//                 }}
//               />
//             </div>
//             <div className='phaseNetworkSymbol'>
//               <input
//                 value={this.state.newNetworkSymbol} spellCheck='false'
//                 onChange={(e) => {
//                   if (e.target.value.length > 8) return e.preventDefault()
//                   this.setState({ newNetworkSymbol: e.target.value })
//                 }}
//                 onFocus={(e) => {
//                   if (e.target.value === this.newNetworkSymbolDefault) this.setState({ newNetworkSymbol: '' })
//                 }}
//                 onBlur={(e) => {
//                   if (e.target.value === '') this.setState({ newNetworkSymbol: this.newNetworkSymbolDefault })
//                 }}
//               />
//             </div>
//             <div className='phaseNetworkExplorer'>
//               <input
//                 value={this.state.newNetworkExplorer} spellCheck='false'
//                 onChange={(e) => {
//                   this.setState({ newNetworkExplorer: e.target.value })
//                 }}
//                 onFocus={(e) => {
//                   if (e.target.value === this.newNetworkExplorerDefault) this.setState({ newNetworkExplorer: '' })
//                 }}
//                 onBlur={(e) => {
//                   if (e.target.value === '') this.setState({ newNetworkExplorer: this.newNetworkExplorerDefault })
//                 }}
//               />
//             </div>
//           </div>
//         </div>
//         <div className='phaseFooter'>{svg.logo(32)}</div>
//       </div>
//     )
//   }
// }



class Settings extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.customMessage = 'Custom Endpoint'
    this.network = context.store('main.currentNetwork.id')
    this.networkType = context.store('main.currentNetwork.type')
    const primaryCustom = context.store('main.networks', this.networkType, this.network, 'connection.primary.custom') || this.customMessage
    const secondaryCustom = context.store('main.networks', this.networkType, this.network, 'connection.secondary.custom') || this.customMessage
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
      primaryCustom, 
      secondaryCustom, 
      resetConfirm: false, 
      expandNetwork: false 
    }
  }

  okProtocol (location) {
    if (location === 'injected') return true
    if (location.endsWith('.ipc')) return true
    if (location.startsWith('wss://') || location.startsWith('ws://')) return true
    if (location.startsWith('https://') || location.startsWith('http://')) return true
    return false
  }

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

  // status (layer) {
  //   const { type, id } = this.store('main.currentNetwork')
  //   const connection = this.store('main.networks', type, id, 'connection', layer)
  //   let status = connection.status
  //   const current = connection.current

  //   if (current === 'custom') {
  //     if (layer === 'primary' && this.state.primaryCustom !== '' && this.state.primaryCustom !== this.customMessage && !this.okProtocol(this.state.primaryCustom)) status = 'invalid target'
  //     if (layer === 'secondary' && this.state.secondaryCustom !== '' && this.state.secondaryCustom !== this.customMessage && !this.okProtocol(this.state.secondaryCustom)) status = 'invalid target'
  //   }
  //   if (status === 'connected' && !connection.network) status = 'loading'
  //   return (
  //     <div className='connectionOptionStatus'>
  //       {this.indicator(status)}
  //       <div className='connectionOptionStatusText'>{status}</div>
  //     </div>
  //   )
  // }

  discord () {
    return (
      <div className='discordInvite' onMouseDown={() => this.store.notify('openExternal', { url: 'https://discord.gg/UH7NGqY' })}>
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

  // indicator (status) {
  //   if (status === 'connected') {
  //     return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorGood' /></div>
  //   } else if (status === 'loading' || status === 'syncing' || status === 'pending' || status === 'standby') {
  //     return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorPending' /></div>
  //   } else {
  //     return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorBad' /></div>
  //   }
  // }

  selectNetwork (network) {
    const [type, id] = network.split(':')
    if (network.type !== type || network.id !== id) link.send('tray:action', 'selectNetwork', type, id)
  }

  expandNetwork (e, expand) {
    e.stopPropagation()
    this.setState({ expandNetwork: expand !== undefined ? expand : !this.state.expandNetwork })
  }

  renderNets () {
    const networks = this.store('main.networks')
    const nets = []
    Object.keys(networks).forEach(type => {
      nets.push(
        <div key={type}>
          {Object.keys(networks[type]).sort((a, b) => {
            return parseInt(a) - parseInt(b)
          }).map(id => {
            return <Network key={type + id} id={id} name={networks[type][id].name} symbol={networks[type][id].symbol} explorer={networks[type][id].explorer} type={type} />
          })}
        </div>
      )
    })
    return nets
  }

  renderConnections () {
    // const { type, id } = this.store('main.currentNetwork')
    // const networkPresets = this.store('main.networkPresets', type)
    // let presets = networkPresets[id] || {}
    // const { type, id } = this.store('main.currentNetwork')
    // const networks = this.store('main.networks')
    // const connection = networks[type][id].connection
    // console.log(presets)
    // const networks = this.store('main.networks')
    const nets = []
    const networks = this.store('main.networks')
    Object.keys(networks).forEach(type => {
      nets.push(
        <div key={type}>
          {Object.keys(networks[type]).sort((a, b) => {
            return parseInt(a) - parseInt(b)
          }).map(id => {
            return <Network 
              key={type + id} 
              id={id} 
              name={networks[type][id].name} 
              symbol={networks[type][id].symbol} 
              explorer={networks[type][id].explorer} 
              type={type} 
              connection={networks[type][id].connection}
            />
          })}
        </div>
      )
    })
    return nets
  }

  renderAddNetwork () {
    const changedNewNetwork = (
      this.state.newNetworkId !== this.newNetworkIdDefault ||
      this.state.newNetworkName !== this.newNetworkNameDefault ||
      this.state.newNetworkExplorer !== this.newNetworkExplorerDefault ||
      this.state.newNetworkSymbol !== this.newNetworkSymbolDefault
    )

    const newNetworkReady = (
      this.state.newNetworkId !== this.newNetworkIdDefault && this.state.newNetworkId !== '' &&
      this.state.newNetworkName !== this.newNetworkNameDefault && this.state.newNetworkName !== '' &&
      this.state.newNetworkExplorer !== this.newNetworkExplorerDefault && this.state.newNetworkExplorer !== ''
    )

    return (
      <div className='network'>
        <div className='phaseNetworkLine'>
          {changedNewNetwork && newNetworkReady ? (
            <div
              className='phaseNetworkSubmit phaseNetworkSubmitEnabled' onMouseDown={() => {
                const net = {
                  id: this.state.newNetworkId,
                  name: this.state.newNetworkName,
                  type: this.state.newNetworkType,
                  explorer: this.state.newNetworkExplorer,
                  symbol: this.state.newNetworkSymbol
                }
                link.send('tray:action', 'addNetwork', net)
                this.setState({
                  newNetworkId: this.newNetworkIdDefault,
                  newNetworkName: this.newNetworkNameDefault,
                  newNetworkExplorer: this.newNetworkExplorerDefault,
                  newNetworkSymbol: this.newNetworkSymbolDefault
                })
              }}
            >
              {svg.save(16)}
            </div>
          ) : (
            <div className='phaseNetworkSubmit'>
              {svg.octicon('plus', { height: 17 })}
            </div>
          )}
          <div className='phaseNetworkName'>
            <input
              value={this.state.newNetworkName} spellCheck='false'
              onChange={(e) => {
                this.setState({ newNetworkName: e.target.value })
              }}
              onFocus={(e) => {
                if (e.target.value === this.newNetworkNameDefault) this.setState({ newNetworkName: '' })
              }}
              onBlur={(e) => {
                if (e.target.value === '') this.setState({ newNetworkName: this.newNetworkNameDefault })
              }}
            />
          </div>
          <div className='phaseNetworkId'>
            <input
              value={this.state.newNetworkId} spellCheck='false'
              onChange={(e) => {
                if (Number(parseInt(e.target.value)) || e.target.value === '') {
                  this.setState({ newNetworkId: e.target.value })
                }
              }}
              onFocus={(e) => {
                if (e.target.value === this.newNetworkIdDefault) this.setState({ newNetworkId: '' })
              }}
              onBlur={(e) => {
                if (e.target.value === '') this.setState({ newNetworkId: this.newNetworkIdDefault })
              }}
            />
          </div>
          <div className='phaseNetworkSymbol'>
            <input
              value={this.state.newNetworkSymbol} spellCheck='false'
              onChange={(e) => {
                if (e.target.value.length > 8) return e.preventDefault()
                this.setState({ newNetworkSymbol: e.target.value })
              }}
              onFocus={(e) => {
                if (e.target.value === this.newNetworkSymbolDefault) this.setState({ newNetworkSymbol: '' })
              }}
              onBlur={(e) => {
                if (e.target.value === '') this.setState({ newNetworkSymbol: this.newNetworkSymbolDefault })
              }}
            />
          </div>
          <div className='phaseNetworkExplorer'>
            <input
              value={this.state.newNetworkExplorer} spellCheck='false'
              onChange={(e) => {
                this.setState({ newNetworkExplorer: e.target.value })
              }}
              onFocus={(e) => {
                if (e.target.value === this.newNetworkExplorerDefault) this.setState({ newNetworkExplorer: '' })
              }}
              onBlur={(e) => {
                if (e.target.value === '') this.setState({ newNetworkExplorer: this.newNetworkExplorerDefault })
              }}
            />
          </div>
        </div>
      </div>
    )
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
      <div className={this.store('panel.view') !== 'networks' ? 'localSettings cardHide' : 'localSettings cardShow'} onMouseDown={e => this.expandNetwork(e, false)}>
        <div className='panelHeader' style={{ zIndex: 50, pointerEvents: 'none' }}>
          <div className='panelHeaderTitle'>Networks</div>
        </div>
        <div className='localSettingsWrap'>
          {this.renderConnections()}
          {this.renderAddNetwork()}
          {this.discord()}
        </div>
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
