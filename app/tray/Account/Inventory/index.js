import React from 'react'
import Restore from 'react-restore'

import InventoryPreview from './InventoryPreview'
import InventoryExpanded from './InventoryExpanded'
import InventoryItems from './InventoryItems'

const filterInventory = (inventory, ethereumNetworks) => {
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

const getHiddenCollections = (inventory, collectionPreferences) => {
  return Object.entries(inventory).reduce((collections, [contractAddress, { meta }]) => {
    const collectionId = `${meta.chainId}:${contractAddress}`
    const preferences = collectionPreferences[collectionId]
    const isHidden = preferences ? preferences.hidden : meta.hideByDefault || false
    if (isHidden) collections.add(collectionId)
    return collections
  }, new Set())
}

class Inventory extends React.Component {
  render() {
    const onAssetClick = (url) => () => {
      this.store.notify('openExternal', { url })
    }

    const inventory = this.store('main.inventory', this.props.account) || {}
    const ethereumNetworks = this.store('main.networks.ethereum')
    const collectionPreferences = this.store('main.assetPreferences.collections') || {}

    const hiddenCollections = getHiddenCollections(inventory, collectionPreferences)
    const enabledChainsInventory = filterInventory(inventory, ethereumNetworks)
    const expandedData = this.props.expandedData || {}

    return this.props.expanded ? (
      this.props.expandedData.currentCollection ? (
        <InventoryItems
          {...this.props}
          onAssetClick={onAssetClick}
          expandedData={expandedData}
          inventory={enabledChainsInventory}
          hiddenCollections={hiddenCollections}
          account={this.props.account}
          key={'expandedCollection'}
        />
      ) : (
        <InventoryExpanded
          {...this.props}
          hiddenCollections={hiddenCollections}
          inventory={enabledChainsInventory}
          key={'expandedList'}
        />
      )
    ) : (
      <InventoryPreview
        {...this.props}
        inventory={enabledChainsInventory}
        key={'previewList'}
        hiddenCollections={hiddenCollections}
      />
    )
  }
}

export default Restore.connect(Inventory)
