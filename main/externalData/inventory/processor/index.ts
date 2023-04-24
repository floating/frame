import log from 'electron-log'

import store from '../../../store'

const setInventory = (account: string, inventory: Inventory) => {
  store.setInventory(account.toLowerCase(), inventory)
}

const updateItems = (account: string, items: InventoryAsset[]) => {
  const inventory = store('main.inventory', account.toLowerCase()) as Inventory
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

    store.setInventoryAsset(account.toLowerCase(), collection, tokenId, item)
  })
}

export default {
  setInventory,
  updateItems
}
