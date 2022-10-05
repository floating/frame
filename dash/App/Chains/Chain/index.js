import React, { useState } from 'react'
import Restore from 'react-restore'

import ChainPreview from './ChainPreview'
import ChainExpanded from './ChainExpanded'
import ChainNew from './ChainNew'

class Chain extends React.Component {
  renderNew () {
    const { id, name, type, explorer, symbol, isTestnet, filter, on, connection, primaryRpc, secondaryRpc } = this.props
    const existingChains = Object.keys(this.store('main.networks.ethereum')).map(id => parseInt(id))
    return (
      <ChainNew
        id={id}
        name={name}
        type={type}
        explorer={explorer}
        symbol={symbol}
        primaryRpc={primaryRpc}
        secondaryRpc={secondaryRpc}
        existingChains={existingChains}
      />
    )
  }

  renderExpanded () {
    const { id, name, type, explorer, symbol, isTestnet, filter, on, connection } = this.props
    const { primaryColor, icon } = this.store('main.networksMeta.ethereum', id)
    const price = this.store('main.networksMeta.ethereum', id, 'nativeCurrency.usd.price') || '?'
    return (
      <ChainExpanded
        id={id}
        name={name}
        type={type}
        explorer={explorer}
        symbol={symbol}
        isTestnet={isTestnet}
        filter={filter}
        on={on}
        connection={connection}
        primaryColor={primaryColor}
        icon={icon}
        price={price}
      />
    )
  }

  renderPreview () {
    const { id, name, type, explorer, symbol, isTestnet, filter, on, connection } = this.props
    const { primaryColor, icon } = this.store('main.networksMeta.ethereum', id)
    const price = this.store('main.networksMeta.ethereum', id, 'nativeCurrency.usd.price') || '?'

    if (
      filter &&
      !this.state.id.toString().includes(filter) && 
      !this.state.name.includes(filter) && 
      !this.state.symbol.includes(filter) && 
      !this.state.explorer.includes(filter) && 
      !this.state.type.includes(filter)
    ) return null

    return (
      <ChainPreview 
        type={type}
        id={id}
        primaryColor={primaryColor}
        icon={icon}
        name={name}
        on={on}
        conneection={connection}
        symbol={symbol}
        price={price}
      />
    )
  }

  render () {
    const { view } = this.props
    if (view === 'setup') {
      return this.renderNew()
    } else if (view === 'expanded') {
      return this.renderExpanded()
    } else if (view === 'preview') {
      return this.renderPreview()
    }
  }
}

export default Restore.connect(Chain)
