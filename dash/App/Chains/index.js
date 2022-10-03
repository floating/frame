import React, { createRef } from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
import svg from '../../../resources/svg'

// import Filter from '../Filter'

import Dropdown from '../../../resources/Components/Dropdown'
import RingIcon from '../../../resources/Components/RingIcon'
import Gas from '../../../resources/Components/Gas'

import Connection from './Connection'
import Chain from './Chain'

// class _SettingsModule extends React.Component {
//   constructor (props, context) {
//     super(props, context)
//     this.state = {
//       expanded: false
//     }
//   }
//   render () {
    
//     const { id, type, symbol, changed } = this.props
//     const price = this.store('main.networksMeta.ethereum', id, 'nativeCurrency.usd.price') || '?'
//     return (
//       <div className='sliceContainer' ref={this.ref}>
//         <div 
//           className='sliceTile sliceTileClickable'
//           onClick={() => {
//             this.setState({ expanded: !this.state.expanded })
//           }}
//         >
//           <div className='sliceChainId'>
//             <div className='sliceChainIdIcon'>{svg.chain(12)}</div>
//             <div className='sliceChainIdNumber'>{id}</div>
//           </div>
//           <div className='sliceChainId'>
//             <div className='sliceChainIdIcon'>{symbol}</div>
//             <div className='sliceChainIdNumber'>{price.toLocaleString()}</div>
//           </div>
//         </div>
//         {this.state.expanded ? (
//           <>
//             <div className='chainConfig cardShow'>  
//               <div className='chainConfigRow'>  
//                 <input
//                   className='chainIdInput'
//                   value={this.state.id} spellCheck='false'
//                   onChange={(e) => {
//                     if (type === 'ethereum' && id === 1) return
//                     this.setState({ id: e.target.value })
//                   }}
//                   onBlur={(e) => {
//                     if (e.target.value === '') this.setState({ id: this.props.id })
//                   }}
//                 />
//                 <input
//                   className='chainSymbolInput'
//                   value={this.state.symbol} spellCheck='false'
//                   onChange={(e) => {
//                     if (type === 'ethereum' && id === 1) return
//                     if (e.target.value.length > 8) return e.preventDefault()
//                     this.setState({ symbol: e.target.value })
//                   }}
//                   onBlur={(e) => {
//                     if (e.target.value === '') this.setState({ symbol: this.props.symbol })
//                   }}
//                 />
//               </div>
//               <div className='chainConfigRow'>
//                 <input
//                   value={this.state.explorer} spellCheck='false'
//                   onChange={(e) => {
//                     this.setState({ explorer: e.target.value })
//                   }}
//                   onBlur={(e) => {
//                     if (e.target.value === '') this.setState({ explorer: this.props.explorer })
//                   }}
//                 />
//               </div>
//             </div>

//             {type === 'ethereum' && id === 1 ? (
//               <div className='chainMore cardShow'>
//                 <div className='moduleButton moduleButtonLocked'>
//                   {svg.lock(11)}
//                 </div>
//               </div>
//             ) : (
//               <div className='chainMore cardShow'>
//                 <div
//                   className='moduleButton moduleButtonBad' onMouseDown={() => {
//                     const { id, name, type, explorer } = this.props
//                     link.send('tray:action', 'removeNetwork', { id, name, explorer, type })
//                   }}
//                 >
//                   {svg.trash(13)} 
//                   <span>remove chain</span>
//                 </div>
//               </div>
//             )}

//             {changed ? (
//               <div className='chainConfigSave cardShow'>
//                 <div
//                   className='moduleButton moduleButtonGood' onMouseDown={() => {
//                     const net = { id: this.props.id, name: this.props.name, type: this.props.type, symbol: this.props.symbol, explorer: this.props.explorer }
//                     const newNet = { id: this.state.id, name: this.state.name, type: this.state.type, symbol: this.state.symbol, explorer: this.state.explorer }
//                     let empty = false
//                     Object.keys(newNet).forEach(k => {
//                       if (typeof newNet[k] === 'string') {
//                         newNet[k] = newNet[k].trim()
//                       }
//                       if (newNet[k] === '') empty = true
//                     })
//                     if (empty) return
//                     this.setState(newNet)
//                     this.setState({ submitted: true })
//                     link.send('tray:action', 'updateNetwork', net, newNet)
//                     setTimeout(() => this.setState({ submitted: false }), 1600)
//                   }}>
//                     {svg.save(11)} <span> save changes</span>
//                   </div>
//                 </div>
//               ) : (this.state.submitted ? (
//                 <div className='chainConfigSave'>
//                   <div className='moduleButton'>
//                     {svg.octicon('check', { height: 22 })}
//                   </div>
//                 </div>
//               ) : null
//             )}
//           </>
//         ) : null}
//       </div>
//     )
//   }
// }

// const SettingsModule = Restore.connect(_SettingsModule)


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


// class _ChainModule extends React.Component {
//   constructor (...args) {
//     super(...args)
//     this.state = {
//       expanded: false
//     }
//     this.ref = createRef()
//   }

//   // clickHandler (e) {
//   //   if (!e.composedPath().includes(this.ref.current)) {
//   //     if (this.state.expanded) this.setState({ expanded: false })
//   //   }
//   // }

//   // componentDidMount () {
//   //   document.addEventListener('click', this.clickHandler.bind(this))
//   // }

//   // componentDidUnmount () {
//   //   document.removeEventListener('click', this.clickHandler.bind(this))
//   // }

//   renderConnection (origin, id) {
//     return (
//       <div 
//         className='sliceTile sliceTileClickable'
//         onClick={() => {
//           this.setState({ expanded: !this.state.expanded })
//         }}
//       >
//         <div className={this.props.active ? 'sliceTileIndicatorLarge sliceTileIndicatorActive' : 'sliceTileIndicatorLarge' } />
//         <div className='sliceTileConnectionName'> 
//           {'Pylon'}
//         </div>
//         <div className='sliceTileBlock'>
//           <div className='sliceTileBlockIcon'>{svg.chain(16)}</div>
//           <div className='sliceTileChainId'>{id}</div>
//           <div className='sliceTileBlockIcon'>{svg.cube(16)}</div>
//           <div>{1223434}</div>
//         </div>
//       </div>
//     )
//   }
//   status (type, id, layer) {
//     const connection = this.store('main.networks', type, id, 'connection', layer)
//     let status = connection.status
//     const current = connection.current

//     if (current === 'custom') {
//       if (layer === 'primary' && this.state.primaryCustom !== '' && this.state.primaryCustom !== this.customMessage) {
//         if (!this.okProtocol(this.state.primaryCustom)) status = 'invalid target'
//         else if (!this.okPort(this.state.primaryCustom)) status = 'invalid port'
//       }

//       if (layer === 'secondary' && this.state.secondaryCustom !== '' && this.state.secondaryCustom !== this.customMessage) {
//         if (!this.okProtocol(this.state.secondaryCustom)) status = 'invalid target'
//         else if (!this.okPort(this.state.secondaryCustom)) status = 'invalid port'
//       }
//     }
//     if (status === 'connected' && !connection.network) status = 'loading'
//     if (!this.store('main.networks', type, id, 'on')) status = 'off'

//     return (
//       <div className='connectionOptionStatus'>
//         {this.indicator(status)}
//         <div className='connectionOptionStatusText'>{status}</div>
//       </div>
//     )
//   }
//   indicator (status) {
//     if (status === 'connected') {
//       return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorGood' /></div>
//     } else if (status === 'loading' || status === 'syncing' || status === 'pending' || status === 'standby') {
//       return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorPending' /></div>
//     } else {
//       return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorBad' /></div>
//     }
//   }
//   render () {
//     const { id, type, connection, changed } = this.props

//     const networkPresets = this.store('main.networkPresets', type)
//     let presets = networkPresets[id] || {}
//     presets = Object.keys(presets).map(i => ({ text: i, value: type + ':' + id + ':' + i }))
//     presets = presets.concat(Object.keys(networkPresets.default).map(i => ({ text: i, value: type + ':' + id + ':' + i })))
//     presets.push({ text: 'Custom', value: type + ':' + id + ':' + 'custom' })

//     return (
//       <div className='sliceContainer' ref={this.ref}>
//         {this.renderConnection('connection', id)}
//         {this.state.expanded ? (
//           <div className='connectionLevels'>
//             <div className='signerPermission signerPermissionNetwork cardShow' style={{ zIndex: 2 }}>
//               <div className={connection.primary.on ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
//                 <div className='connectionOptionToggle'>
//                   <div className='signerPermissionSetting'>Primary</div>
//                   <div className={connection.primary.on ? 'signerPermissionToggleSmall signerPermissionToggleSmallOn' : 'signerPermissionToggleSmall'} onMouseDown={_ => link.send('tray:action', 'toggleConnection', type, id, 'primary')}>
//                     <div className='signerPermissionToggleSwitch' />
//                   </div>
//                 </div>
//                 {connection.primary.on ? (
//                   <>
//                     <div className='connectionOptionDetails cardShow'>
//                       <div className='connectionOptionDetailsInset'>
//                         {this.status(type, id, 'primary')}
//                         <Dropdown
//                           syncValue={type + ':' + id + ':' + connection.primary.current}
//                           onChange={preset => {
//                             const [type, id, value] = preset.split(':')
//                             link.send('tray:action', 'selectPrimary', type, id, value)
//                           }}
//                           options={presets}
//                         />
//                       </div>
//                     </div>
//                     <div className={connection.primary.current === 'custom' && connection.primary.on ? 'connectionCustomInput connectionCustomInputOn cardShow' : 'connectionCustomInput'}>
//                       <input 
//                         className='customInput'
//                         tabIndex='-1'
//                         value={this.state.primaryCustom}
//                         onFocus={() => this.customPrimaryFocus()} 
//                         onBlur={() => this.customPrimaryBlur()}
//                         onChange={e => this.inputPrimaryCustom(e)}
//                       />
//                     </div>
//                   </>
//                 ) : null}
//               </div>
//             </div>
//             <div className='signerPermission signerPermissionNetwork cardShow' style={{ zIndex: 1 }}>
//               <div className={connection.secondary.on ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
//                 <div className='connectionOptionToggle'>
//                   <div className='signerPermissionSetting'>Secondary</div>
//                   <div className={connection.secondary.on ? 'signerPermissionToggleSmall signerPermissionToggleSmallOn' : 'signerPermissionToggleSmall'} onMouseDown={_ => link.send('tray:action', 'toggleConnection', type, id, 'secondary')}>
//                     <div className='signerPermissionToggleSwitch' />
//                   </div>
//                 </div>
//                 {connection.secondary.on ? (
//                   <>
//                     <div className='connectionOptionDetails cardShow'>
//                       <div className='connectionOptionDetailsInset'>
//                         {this.status(type, id, 'secondary')}
//                         <Dropdown
//                           syncValue={type + ':' + id + ':' + connection.secondary.current}
//                           onChange={preset => {
//                             const [type, id, value] = preset.split(':')
//                             link.send('tray:action', 'selectSecondary', type, id, value)
//                           }}
//                           options={presets}
//                         />
//                       </div>
//                     </div>
//                     <div className={connection.secondary.current === 'custom' && connection.secondary.on ? 'connectionCustomInput connectionCustomInputOn cardShow' : 'connectionCustomInput'}>
//                       <input tabIndex='-1' value={this.state.secondaryCustom} onFocus={() => this.customSecondaryFocus()} onBlur={() => this.customSecondaryBlur()} onChange={e => this.inputSecondaryCustom(e)} />
//                     </div>
//                   </>
//                 ) : null}
//               </div>
//             </div>
//           </div>   
//         ) : null}
//       </div>
//     )
//   }
// }

// const ChainModule = Restore.connect(_ChainModule)



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
      <div 
        className='discordInvite'
        onClick={() => link.send('tray:openExternal', 'https://discord.gg/UH7NGqY')}
      >
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

  renderConnections (testnetsOnly = false) {
    const nets = []
    const networks = this.store('main.networks')

    const { filter } = this.state

    Object.keys(networks).forEach(type => {
      nets.push(
        <div key={type}>
          {Object.keys(networks[type])
            .map(id => parseInt(id))
            .sort((a, b) => a - b)
            .filter(id => networks[type][id].isTestnet === testnetsOnly)
            .map(id => {
              return <Chain
                key={type + id}
                id={id}
                name={networks[type][id].name}
                symbol={networks[type][id].symbol}
                explorer={networks[type][id].explorer}
                isTestnet={networks[type][id].isTestnet}
                type={type}
                connection={networks[type][id].connection}
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

  renderChains () {
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
          {this.renderConnections()}
          <div className='networkBreak'>
            <div className='networkBreakLayer'>Testnets</div>
          </div>
          {this.renderConnections(true)}
          {this.discord()}
        </div>
      </div>
    )
  }

  renderChain (chain) {
    const { id, type, name, isTestnet, symbol, explorer } = chain
    const networks = this.store('main.networks')
    return (
      <div className={'localSettings cardShow'}>
        <div className='localSettingsWrap'>
          <Chain
            key={type + id}
            id={id}
            name={networks[type][id].name}
            symbol={networks[type][id].symbol}
            explorer={networks[type][id].explorer}
            isTestnet={networks[type][id].isTestnet}
            type={type}
            connection={networks[type][id].connection}
            on={networks[type][id].on}
            expanded={true}
          />
        </div>
      </div>
    )
  }

  render () {
    const { selectedChain } = this.props.data
    if (selectedChain) {
      return this.renderChain(selectedChain)
    } else {
      return this.renderChains()
    }
  }
}

export default Restore.connect(Settings)
