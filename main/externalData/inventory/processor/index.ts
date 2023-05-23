import log from 'electron-log'

import store from '../../../store'
import { Inventory, InventoryAsset } from '../../../store/state'

const storeApi = {
  getInventory(account: string) {
    return (store('main.inventory', account.toLowerCase()) || {}) as Inventory
  },
  setInventory(account: string, inventory: Inventory) {
    store.setInventory(account.toLowerCase(), inventory)
  },
  setInventoryAsset(account: string, collection: string, tokenId: string, item: InventoryAsset) {
    store.setInventoryAsset(account.toLowerCase(), collection, tokenId, item)
  }
}

export const updateCollections = (account: string, inventory: Inventory) => {
  const existingInventory = storeApi.getInventory(account)

  for (const contractAddress of Object.keys(inventory)) {
    const existingCollection = existingInventory[contractAddress]
    const items = existingCollection?.items || {}
    inventory[contractAddress].items = items
  }

  storeApi.setInventory(account, inventory)
}

export const updateItems = (account: string, items: InventoryAsset[]) => {
  const inventory = storeApi.getInventory(account)
  for (const item of items) {
    if (!item.name) return
    const collection = item.contract.toLowerCase()
    const tokenId = item.tokenId.toLowerCase()

    if (!inventory[collection]) {
      log.warn('collection not found', { inventory })
      return
    }

    storeApi.setInventoryAsset(account, collection, tokenId, item)
  }
}
