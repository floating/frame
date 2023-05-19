import store from '../../../../main/store'
import log from 'electron-log'
import { updateCollections, updateItems } from '../../../../main/externalData/inventory/processor'
import { randomBytes } from 'crypto'

const randomStr = () => randomBytes(32).toString('hex')

const account = '0xAddress'

let mockExistingInventory = {} as Inventory

jest.mock('../../../../main/store', () => {
  const store = jest.fn(() => mockExistingInventory) as unknown as Store
  store.setInventory = jest.fn()
  store.getInventory = jest.fn()
  store.setInventoryAsset = jest.fn()

  return store
})

jest.mock('electron-log', () => ({
  warn: jest.fn()
}))

const Collection = (items: Record<string, InventoryAsset>) => ({
  meta: {
    name: randomStr(),
    description: randomStr(),
    image: randomStr(),
    chainId: Math.floor(Math.random() * 10),
    external_url: randomStr()
  },
  items
})

describe('updateCollections', () => {
  it('should initialize new collections when existing inventory is available', () => {
    // Define an updated inventory with two collections
    const updatedInventory = {
      '0x1': Collection({
        '1': {} as InventoryAsset,
        '2': {} as InventoryAsset
      }),
      '0x2': Collection({
        '3': {} as InventoryAsset
      })
    }

    mockExistingInventory = {
      '0x2': Collection({
        '3': {} as InventoryAsset
      })
    }

    updateCollections(account, updatedInventory)

    // The call to store.setInventory should include both collections
    expect(store.setInventory).toHaveBeenCalledWith(account.toLowerCase(), updatedInventory)
  })

  // This case occurs on startup
  it('should initialize new collections when existing inventory is undefined', () => {
    // Define an updated inventory with two collections
    const updatedInventory = {
      '0x1': Collection({
        '1': {} as InventoryAsset,
        '2': {} as InventoryAsset
      })
    }

    updateCollections(account, updatedInventory)

    // The call to store.setInventory should include both collections
    expect(store.setInventory).toHaveBeenCalledWith(account.toLowerCase(), updatedInventory)
  })

  it('removes collections no longer present in the updated inventory', () => {
    // Define an updated inventory with only one collection
    const updatedInventory = {
      '0x1': Collection({
        '1': {} as InventoryAsset
      })
    }

    mockExistingInventory = {
      '0x2': Collection({
        '3': {} as InventoryAsset
      })
    }

    updateCollections(account, updatedInventory)

    // The call to store.setInventory should only include the updated collection
    expect(store.setInventory).toHaveBeenCalledWith(account.toLowerCase(), updatedInventory)
  })

  it('retains the existing data of items that are still owned when the inventory is updated', () => {
    // Create a new inventory with two items in one collection
    const newInventory = {
      '0x1': Collection({
        '1': {} as InventoryAsset,
        '2': {} as InventoryAsset
      })
    }

    // Create an existing inventory with one item in the same collection
    mockExistingInventory = {
      '0x1': Collection({
        '1': {
          name: 'name'
        } as InventoryAsset
      })
    }

    updateCollections(account, newInventory)

    expect(store.setInventory).toHaveBeenCalledWith(account.toLowerCase(), {
      '0x1': {
        ...newInventory['0x1'],
        items: {
          '1': {
            name: 'name'
          },
          '2': {}
        }
      }
    })
  })

  it('removes data of items no longer owned after inventory update', () => {
    // Create an existing inventory with two items in one collection
    mockExistingInventory = {
      '0x1': Collection({
        '1': { name: 'name' } as InventoryAsset,
        '2': { name: 'otherName' } as InventoryAsset
      })
    }

    // Create a new inventory with only one of the items from the existing inventory
    const newInventory = {
      '0x1': Collection({
        '1': {} as InventoryAsset // Still owned item
        // Item '2' is not included, so it's no longer owned
      })
    }

    updateCollections(account, newInventory)

    expect(store.setInventory).toHaveBeenCalledWith(account.toLowerCase(), {
      '0x1': {
        ...newInventory['0x1'],
        items: {
          '1': { name: 'name' } // Still owned item with preserved data
          // Item '2' data should not be present
        }
      }
    })
  })
})

describe('updateItems', () => {
  // 1. Update an existing item in the inventory
  it('updates the inventory asset data for existing items', () => {
    const items = [
      {
        contract: '0x1',
        tokenId: '1',
        name: 'newName'
      },
      {
        contract: '0x1',
        tokenId: '2',
        name: 'name2'
      }
    ]

    mockExistingInventory = {
      '0x1': Collection({
        '1': { contract: '0x1', tokenId: '1', name: 'name' } as InventoryAsset,
        '2': {} as InventoryAsset
      })
    }

    updateItems(account, items)

    expect(store.setInventoryAsset).toHaveBeenNthCalledWith(1, account.toLowerCase(), '0x1', '1', {
      ...items[0],
      name: 'newName'
    })

    expect(store.setInventoryAsset).toHaveBeenNthCalledWith(2, account.toLowerCase(), '0x1', '2', items[1])
  })

  // 2. Try to update a non-existent item
  it('logs a warning and does not update when the item does not exist in the inventory', () => {
    const items = [
      {
        contract: '0x1',
        tokenId: '2',
        name: 'updatedName'
      } as InventoryAsset
    ]
    mockExistingInventory = {
      '0x1': Collection({
        '1': { name: 'oldName' } as InventoryAsset
      })
    }

    updateItems(account, items)

    expect(log.warn).toHaveBeenCalled()
    expect(store.setInventoryAsset).not.toHaveBeenCalled()
  })

  // 3. Try to update an item in a non-existent collection
  it('logs a warning and does not update when the collection does not exist in the inventory', () => {
    const items = [
      {
        contract: '0x2',
        tokenId: '1',
        name: 'updatedName'
      } as InventoryAsset
    ]

    mockExistingInventory = {
      '0x1': Collection({
        '1': { name: 'oldName' } as InventoryAsset
      })
    }

    updateItems(account, items)

    expect(log.warn).toHaveBeenCalled()
    expect(store.setInventoryAsset).not.toHaveBeenCalled()
  })
})
