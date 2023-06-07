import { randomBytes } from 'crypto'

import store from '../../../../main/store'
import { updateCollections, updateItems } from '../../../../main/externalData/inventory/processor'

import type { Inventory, InventoryAsset } from '../../../../main/store/state'

const randomStr = () => randomBytes(32).toString('hex')

const genInventoryAsset = (name = randomStr()) => ({
  name,
  tokenId: randomStr(),
  media: {
    source: randomStr(),
    format: 'image' as const,
    cdn: {
      main: randomStr(),
      thumb: randomStr(),
      frozen: randomStr()
    }
  },
  contract: randomStr(),
  externalLink: randomStr()
})

const account = '0xAddress'

let mockExistingInventory = {} as Inventory

jest.mock('../../../../main/store', () => {
  const store = jest.fn(() => mockExistingInventory) as unknown as Store
  store.setInventory = jest.fn()
  store.getInventory = jest.fn()
  store.setInventoryAssets = jest.fn()

  return store
})

const Collection = (items: InventoryAsset[] = []) => ({
  meta: {
    name: randomStr(),
    description: randomStr(),
    media: {
      source: randomStr(),
      format: 'image' as const,
      cdn: {
        main: randomStr(),
        thumb: randomStr(),
        frozen: randomStr()
      }
    },
    chainId: Math.floor(Math.random() * 10),
    external_url: randomStr(),
    tokens: items.map((item) => item.tokenId)
  },
  items
})

beforeEach(() => {
  mockExistingInventory = {}
})

describe('#updateCollections', () => {
  it('adds new collections when there are no existing collections', () => {
    const updatedInventory = {
      '0x1': Collection(),
      '0x2': Collection()
    }

    mockExistingInventory = {}

    updateCollections(account, updatedInventory)

    expect(store.setInventory).toHaveBeenCalledWith(account.toLowerCase(), updatedInventory)
  })

  it('preserves existing items when updating collection metadata', () => {
    const item = genInventoryAsset()
    const existingCollection = Collection([item])

    mockExistingInventory = {
      '0x1': existingCollection
    }

    const newInventory = {
      '0x1': {
        meta: {
          ...existingCollection.meta,
          name: 'newName'
        },
        items: existingCollection.items
      }
    }

    updateCollections(account, newInventory)

    expect(store.setInventory).toHaveBeenCalledWith(account.toLowerCase(), {
      '0x1': {
        meta: newInventory['0x1'].meta,
        items: existingCollection.items
      }
    })
  })

  it('initializes new collections with an empty items dictionary when there is no existing inventory', () => {
    const updatedInventory = {
      '0x1': Collection([])
    }

    updateCollections(account, updatedInventory)

    expect(store.setInventory).toHaveBeenCalledWith(account.toLowerCase(), updatedInventory)
  })
})

describe('#updateItems', () => {
  it('updates items for a given collection', () => {
    const items = [
      {
        contract: '0x1',
        tokenId: '1',
        name: 'newName',
        media: {
          source: '',
          format: '' as const,
          cdn: {
            main: '',
            thumb: '',
            frozen: ''
          }
        }
      },
      {
        contract: '0x1',
        tokenId: '2',
        name: 'name2',
        media: {
          source: '',
          format: '' as const,
          cdn: {
            main: '',
            thumb: '',
            frozen: ''
          }
        }
      }
    ]

    mockExistingInventory = {
      '0x1': Collection()
    }

    updateItems(account, items)

    expect(store.setInventoryAssets).toHaveBeenCalledWith(account.toLowerCase(), '0x1', [items[0], items[1]])
  })
})
