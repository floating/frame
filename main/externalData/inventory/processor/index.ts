import log from 'electron-log'

import { storeApi } from '../../storeApi'

import type { Inventory, InventoryAsset } from '../../../store/state'

export const updateCollections = (account: string, inventory: Inventory) => {
  const existingInventory = storeApi.getInventory(account)
  const collectionContractAddresses = Object.entries(inventory)

  // this only updates collection metadata
  const updatedInventory = collectionContractAddresses.reduce((inv, [contractAddress, collection]) => {
    const existingCollection = existingInventory[contractAddress]
    const updatedItems = (existingCollection?.items || []).filter((item) =>
      collection.meta.tokens.some((t) => t === item.tokenId)
    )

    inv[contractAddress] = {
      ...collection,
      items: updatedItems
    }

    return inv
  }, {} as Inventory)

  storeApi.setInventory(account, updatedInventory)
}

export const updateItems = (account: string, items: InventoryAsset[]) => {
  const inventory = storeApi.getInventory(account)

  const itemsByCollection = items.reduce((acc, item) => {
    const collection = item.contract.toLowerCase()

    if (!inventory[collection]) {
      log.warn('Collection not found', { inventory, collection })
      return acc
    }

    acc[collection] = [...(acc[collection] || []), item]

    return acc
  }, {} as Record<string, InventoryAsset[]>)

  Object.entries(itemsByCollection).forEach(([collection, items]) =>
    storeApi.setInventoryAssets(account, collection, items)
  )
}
