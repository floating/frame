import log from 'electron-log'

import { Account, CollectionItem } from '../../surface'

//TODO: move these types
type AccountCollection = Account['inventory']['any']

const toMeta = (collection: AccountCollection): InventoryCollection['meta'] => {
  return {
    name: collection.name,
    description: collection.description,
    image: collection.image,
    chainId: collection.chainId,
    external_url: ''
  }
}

const toItems = (collection: AccountCollection): InventoryCollection['items'] => {
  return collection.ownedItems.reduce((items, item) => {
    return {
      ...items,
      [item]: {}
    }
  }, {})
}

const toInventoryAsset = (item: CollectionItem): InventoryAsset => ({
  name: item.name,
  tokenId: item.tokenId,
  img: item.image,
  ...(item.link && { externalLink: item.link })
})

const toInventoryCollection = (collection: AccountCollection): InventoryCollection => {
  const meta = toMeta(collection)
  const items = toItems(collection)

  return {
    meta,
    items
  }
}

export type InventoryProcessor = ReturnType<typeof InventoryProcessor>

function InventoryProcessor(store: Store) {
  const updateAccount = (account: Account) => {
    const inventory = Object.keys(account.inventory).reduce((inventory, collection) => {
      return {
        ...inventory,
        [collection.toLowerCase()]: toInventoryCollection(account.inventory[collection])
      }
    }, {} as Inventory)

    store.setInventory(account.address.toLowerCase(), inventory)
  }

  const updateItems = (account: string, items: CollectionItem[]) => {
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

      store.setInventoryAsset(account.toLowerCase(), collection, tokenId, toInventoryAsset(item))
    })
  }

  return { updateAccount, updateItems }
}

export default InventoryProcessor
