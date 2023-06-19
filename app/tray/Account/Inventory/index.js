import React from 'react'
import Restore from 'react-restore'

import InventoryPreview from './InventoryPreview'
import InventoryExpanded from './InventoryExpanded'
import InventoryItems from './InventoryItems'

const filterOutDisabledChains = (inventory, ethereumNetworks) => {
  return Object.fromEntries(
    Object.entries(inventory).filter(
      ([
        _cAddress,
        {
          meta: { chainId }
        }
      ]) => {
        return ethereumNetworks[chainId]?.on
      }
    )
  )
}

class Inventory extends React.Component {
  render() {
    const onAssetClick = (url) => () => {
      this.store.notify('openExternal', { url })
    }

    const inventory = this.store('main.inventory', this.props.account)
    const ethereumNetworks = this.store('main.networks.ethereum')

    const enabledChainsInventory = filterOutDisabledChains(inventory, ethereumNetworks)
    const expandedData = this.props.expandedData || {}

    return this.props.expanded ? (
      this.props.expandedData.currentCollection ? (
        <InventoryItems
          {...this.props}
          onAssetClick={onAssetClick}
          expandedData={expandedData}
          inventory={enabledChainsInventory}
          account={this.props.account}
          key={'expandedCollection'}
        />
      ) : (
        <InventoryExpanded {...this.props} inventory={enabledChainsInventory} key={'expandedList'} />
      )
    ) : (
      <InventoryPreview {...this.props} inventory={enabledChainsInventory} key={'previewList'} />
    )
  }
}

export default Restore.connect(Inventory)
