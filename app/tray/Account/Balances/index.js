import React from 'react'
import Restore from 'react-restore'

import BalancesPreview from './BalancesPreview'
import BalancesExpanded from './BalancesExpanded'
//TODO: move common logic outside of the individial BalanceX components..
class Balances extends React.Component {
  render() {
    const {
      balances: { populatedChains }
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

    return this.props.expanded ? (
      <BalancesExpanded
        {...this.props}
        populatedChains={populatedChains}
        allChainsUpdated={allChainsUpdated}
      />
    ) : (
      <BalancesPreview
        {...this.props}
        populatedChains={populatedChains}
        allChainsUpdated={allChainsUpdated}
      />
    )
  }
}

export default Restore.connect(Balances)
