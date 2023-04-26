import React from 'react'
import Restore from 'react-restore'

import BalancesPreview from './BalancesPreview'
import BalancesExpanded from './BalancesExpanded'

class Balances extends React.Component {
  render() {
    const {
      balances: { populatedChains = {} }
    } = this.store('main.accounts', this.props.account)
    const connectedChains = Object.values(this.store('main.networks.ethereum') || {}).reduce((acc, n) => {
      if ((n.connection.primary || {}).connected || (n.connection.secondary || {}).connected) {
        acc.push(n.id)
      }
      return acc
    }, [])

    const allChainsUpdated = connectedChains.every(
      (chainId) => populatedChains[chainId] && populatedChains[chainId].expires > Date.now()
    )

    const ethereumNetworks = this.store('main.networks.ethereum')
    const networksMeta = this.store('main.networksMeta.ethereum')
    const { address, lastSignerType } = this.store('main.accounts', this.props.account)
    const storedBalances = this.store('main.balances', address) || []
    const rates = this.store('main.rates')

    const Component = this.props.expanded ? BalancesExpanded : BalancesPreview

    return (
      <Component
        {...this.props}
        populatedChains={populatedChains}
        allChainsUpdated={allChainsUpdated}
        ethereumNetworks={ethereumNetworks}
        networksMeta={networksMeta}
        storedBalances={storedBalances}
        rates={rates}
        lastSignerType={lastSignerType}
      />
    )
  }
}

export default Restore.connect(Balances)
