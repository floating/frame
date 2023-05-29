import log from 'electron-log'

import { storeApi } from '../../storeApi'

const setInventory = (account: string, inventory: Inventory) => storeApi.setInventory(account, inventory)

const updateItems = (account: string, items: InventoryAsset[]) => {
  const inventory = storeApi.getInventory(account)
  items.forEach((item) => {
    const collection = item.contract.toLowerCase()
    const tokenId = item.tokenId.toLowerCase()

    if (!inventory[collection]) {
      log.warn('collection not found', { inventory })
      return
    }

    if (!inventory[collection].items[tokenId]) {
      log.warn('tokenId not found', { inventory })
      return
    }

    storeApi.setInventoryAsset(account, collection, tokenId, item)
  })
}

export default {
  setInventory,
  updateItems
}
