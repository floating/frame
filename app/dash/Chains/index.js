import React from 'react'
import Restore from 'react-restore'

import Chain from './Chain'
import link from '../../../resources/link'

class Settings extends React.Component {
  constructor(props, context) {
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
      <div className='quitFrame'>
        <div onMouseDown={() => link.send('tray:quit')} className='quitFrameButton'>
          Quit
        </div>
      </div>
    )
  }

  selectNetwork(network) {
    const [type, id] = network.split(':')
    if (network.type !== type || network.id !== id) link.send('tray:action', 'selectNetwork', type, id)
  }

  renderConnections(testnetsOnly = false) {
    const nets = []
    const networks = this.store('main.networks')
    const metadata = this.store('main.networksMeta')
    const { filter } = this.state

    Object.keys(networks).forEach((type) => {
      nets.push(
        <div key={type}>
          {Object.keys(networks[type])
            .map((id) => parseInt(id))
            .sort((a, b) => a - b)
            .filter((id) => networks[type][id].isTestnet === testnetsOnly)
            .sort((a, b) => {
              const aOn = networks[type][a].on
              const bOn = networks[type][b].on
              return (aOn && bOn) || (!aOn && !bOn) ? 0 : aOn && !bOn ? -1 : 1
            })
            .map((id) => {
              const key = type + id
              const { explorer, isTestnet, connection, on, name } = networks[type][id]
              const {
                nativeCurrency: { symbol = '?', name: nativeCurrencyName, icon: nativeCurrencyIcon },
                icon
              } = metadata[type][id]
              const chain = {
                id,
                type,
                symbol,
                explorer,
                isTestnet,
                connection,
                on,
                filter,
                name,
                nativeCurrencyName,
                nativeCurrencyIcon,
                icon
              }
              return <Chain key={key} {...chain} view={'preview'} />
            })}
        </div>
      )
    })
    return nets
  }

  renderChains() {
    const networks = this.store('main.networks')
    const networkOptions = []
    Object.keys(networks).forEach((type) => {
      Object.keys(networks[type]).forEach((id) => {
        networkOptions.push({ text: networks[type][id].name, value: type + ':' + id })
      })
    })

    return (
      <div key={'chainList'} className={'localSettings cardShow'}>
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

  renderChain(chain) {
    const { id, type } = chain
    const networks = this.store('main.networks')
    const metadata = this.store('main.networksMeta')
    return (
      <div className={'localSettings cardShow'}>
        <div className='localSettingsWrap'>
          <Chain
            key={type + id}
            id={id}
            name={networks[type][id].name}
            symbol={metadata[type][id].nativeCurrency.symbol}
            explorer={networks[type][id].explorer}
            isTestnet={networks[type][id].isTestnet}
            type={type}
            connection={networks[type][id].connection}
            on={networks[type][id].on}
            nativeCurrencyName={metadata[type][id].nativeCurrency.name}
            nativeCurrencyIcon={metadata[type][id].nativeCurrency.icon}
            icon={metadata[type][id].icon}
            view={'expanded'}
          />
        </div>
      </div>
    )
  }

  renderNewChain(newChain) {
    return (
      <div className={'localSettings cardShow'}>
        <div className='localSettingsWrap'>
          <Chain
            key={newChain.type + newChain.id}
            id={newChain.id}
            name={newChain.name}
            symbol={newChain.symbol}
            explorer={newChain.explorer}
            isTestnet={newChain.isTestnet}
            type={newChain.type}
            primaryRpc={newChain.primaryRpc}
            secondaryRpc={newChain.secondaryRpc}
            nativeCurrencyName={newChain.nativeCurrencyName}
            nativeCurrencyIcon={newChain.nativeCurrencyIcon}
            icon={newChain.icon}
            view={'setup'}
          />
        </div>
      </div>
    )
  }

  render() {
    const { selectedChain, newChain } = this.props.data
    if (selectedChain) {
      return this.renderChain(selectedChain)
    } else if (newChain) {
      return this.renderNewChain(newChain)
    } else {
      return this.renderChains()
    }
  }
}

export default Restore.connect(Settings)
