import React from 'react'
import Restore from 'react-restore'

import ChainPreview from './ChainPreview'
import ChainExpanded from './ChainExpanded'
import ChainNew from './ChainNew'

class Chain extends React.Component {
  renderNew() {
    const existingChains = Object.keys(this.store('main.networks.ethereum')).map((id) => parseInt(id))

    return (
      <ChainNew
        {...{
          ...this.props,
          existingChains
        }}
      />
    )
  }

  renderExpanded() {
    const { id } = this.props
    const { primaryColor } = this.store('main.networksMeta.ethereum', id)
    const price = this.store('main.networksMeta.ethereum', id, 'nativeCurrency.usd.price') || '?'

    return (
      <ChainExpanded
        {...{
          ...this.props,
          primaryColor,
          price
        }}
      />
    )
  }

  renderPreview() {
    const { id, filter } = this.props
    const { primaryColor } = this.store('main.networksMeta.ethereum', id)
    const price = this.store('main.networksMeta.ethereum', id, 'nativeCurrency.usd.price') || '?'

    if (
      filter &&
      !this.state.id.toString().includes(filter) &&
      !this.state.name.includes(filter) &&
      !this.state.symbol.includes(filter) &&
      !this.state.explorer.includes(filter) &&
      !this.state.type.includes(filter)
    )
      return null

    return (
      <ChainPreview
        {...{
          ...this.props,
          primaryColor,
          price
        }}
      />
    )
  }

  render() {
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
