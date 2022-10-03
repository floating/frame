import React, { createRef } from 'react'
import Restore from 'react-restore'
import link from '../../../../resources/link'
import svg from '../../../../resources/svg'

import ChainEditForm from './ChainEditForm'

// import Filter from '../Filter'

import Dropdown from '../../../../resources/Components/Dropdown'
import RingIcon from '../../../../resources/Components/RingIcon'
import Gas from '../../../../resources/Components/Gas'

import Connection from '../Connection'

const labels = {
  title: 'Update Chain',
  submit: 'Update Chain',
  submitted: 'Updating'
}

class Chain extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.customMessage = 'Custom Endpoint'
    const { id, name, type, explorer, symbol } = this.props
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

  renderExpanded () {
    const changed = (
      this.state.id && 
      this.state.name && 
      this.state.symbol && 
      this.state.explorer && 
      this.state.type && (
        this.props.id !== this.state.id ||
        this.props.name !== this.state.name ||
        this.props.symbol !== this.state.symbol ||
        this.props.explorer !== this.state.explorer ||
        this.props.type !== this.state.type
      )
    )

    const { id, name, type, explorer, symbol, isTestnet, filter } = this.props
   
    const networkPresets = this.store('main.networkPresets', type)
    let presets = networkPresets[id] || {}
    presets = Object.keys(presets).map(i => ({ text: i, value: type + ':' + id + ':' + i }))
    presets = presets.concat(Object.keys(networkPresets.default).map(i => ({ text: i, value: type + ':' + id + ':' + i })))
    presets.push({ text: 'Custom', value: type + ':' + id + ':' + 'custom' })

    const gas = Math.round(parseInt(this.store('main.networksMeta.ethereum', this.state.id, 'gas.price.levels.fast'), 'hex') / 1e9) || '---'
    const price = this.store('main.networksMeta.ethereum', this.state.id, 'nativeCurrency.usd.price') || '?'
    // const change24hr = this.store('main.networksMeta.ethereum', this.state.id, 'nativeCurrency.usd.change24hr') || '?'
    // const symbol = this.store('main.networks.ethereum', this.state.id, 'symbol') || '?'

    const { primaryColor, icon } = this.store('main.networksMeta.ethereum', id)

    const chain = { id, type, name, isTestnet, symbol, explorer }
    const color = primaryColor

    return (
      <div className='network'>
        <div className='signerTop'>
          <div className='signerDetails'>
            <div className='signerIcon'>
              <RingIcon 
                color={`var(--${primaryColor})`}
                img={icon}
                svgName={name}
              />
            </div>
            {/* <div className='signerType' style={this.props.inSetup ? {top: '21px'} : {top: '24px'}}>{this.props.model}</div> */}
            <div className='signerName'>
              {this.props.name}
            </div>
          </div>
          <div className='signerMenuItems'>
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
        </div>

        <div className='chainModules'>
          <Connection expanded={true} changed={changed} {...this.props} />
        </div>

        <ChainEditForm
          chain={{ ...chain, color }}
          labels={labels}
          existingChain={true}
        />
      </div>
    )
  }

  renderPreview () {
    const changed = (
      this.state.id && 
      this.state.name && 
      this.state.symbol && 
      this.state.explorer && 
      this.state.type && (
        this.props.id !== this.state.id ||
        this.props.name !== this.state.name ||
        this.props.symbol !== this.state.symbol ||
        this.props.explorer !== this.state.explorer ||
        this.props.type !== this.state.type
      )
    )

    const { id, name, type, explorer, symbol, isTestnet, filter } = this.props
   
    const networkPresets = this.store('main.networkPresets', type)
    let presets = networkPresets[id] || {}
    presets = Object.keys(presets).map(i => ({ text: i, value: type + ':' + id + ':' + i }))
    presets = presets.concat(Object.keys(networkPresets.default).map(i => ({ text: i, value: type + ':' + id + ':' + i })))
    presets.push({ text: 'Custom', value: type + ':' + id + ':' + 'custom' })

    const gas = Math.round(parseInt(this.store('main.networksMeta.ethereum', this.state.id, 'gas.price.levels.fast'), 'hex') / 1e9) || '---'
    const price = this.store('main.networksMeta.ethereum', this.state.id, 'nativeCurrency.usd.price') || '?'
    const change24hr = this.store('main.networksMeta.ethereum', this.state.id, 'nativeCurrency.usd.change24hr') || '?'
    // const symbol = this.store('main.networks.ethereum', this.state.id, 'symbol') || '?'

    const { primaryColor, icon } = this.store('main.networksMeta.ethereum', id)

    if (
      filter &&
      !this.state.id.toString().includes(filter) && 
      !this.state.name.includes(filter) && 
      !this.state.symbol.includes(filter) && 
      !this.state.explorer.includes(filter) && 
      !this.state.type.includes(filter)
    ) return null

    return (
      <div className='network'>
        <div className='signerTop'>
          <div className='signerDetails'>
            <div className='signerIcon'>
              <RingIcon 
                color={`var(--${primaryColor})`}
                img={icon}
                svgName={name}
              />
            </div>
            {/* <div className='signerType' style={this.props.inSetup ? {top: '21px'} : {top: '24px'}}>{this.props.model}</div> */}
            <div className='signerName'>
              {this.props.name}
              {/* <div className='signerNameUpdate'>
                {svg.save(14)}
              </div> */}
            </div>
          </div>
          <div className='signerMenuItems'>
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
            <div className='signerExpand' onClick={() => {
              const chain = { id, type, name, isTestnet, symbol, explorer }
              // link.send('tray:action', 'navDash', { view: 'notify', data: { notify: 'updateChain', notifyData: { chain }} })
              link.send('tray:action', 'navDash', { view: 'chains', data: { selectedChain: chain } })
            }}>
              {svg.bars(14)}
            </div>
          </div>
          {/* {this.status()} */}
        </div>
        {this.props.on ? (
          <div className='chainModules'>
            <Connection changed={changed} {...this.props} />
            <Gas chainId={this.props.id} /> 
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

  render () {
    return this.props.expanded ? (
      this.renderExpanded()
    ) : (
      this.renderPreview()
    )
  }
}

export default Restore.connect(Chain)