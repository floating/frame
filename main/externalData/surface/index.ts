import log from 'electron-log'
import createPylon, { Unsubscribable } from '@framelabs/pylon-api-client'

import Networks from './networks'
import bProcessor from '../balances/processor'
import iProcessor from '../inventory/processor'
import { TokenBalance } from '../balances/scan'
import { formatUnits } from 'ethers/lib/utils'

type Subscription = Unsubscribable & { unsubscribables: Unsubscribable[]; collectionItems: CollectionItem[] }

//TODO: do we need to export these from surface?...
type ItemCollectionId = {
  contract: string
  chainId: number
}

type ItemCollection = ItemCollectionId & {
  name: string
  description: string
  image: string
}

type CollectionMetdata = ItemCollection & {
  ownedItems: string[]
}

type BalanceItem = {
  contract: string
  image: string
  name: string
  symbol: string
  chainId: number
  decimals: number
  amount: string
}

interface CollectionItem {
  link: string
  chainId: number
  contract: string
  tokenId: string
  name: string
  image: string
  description: string
}
interface CollectionItem {
  contract: string
  chainId: number
  tokenId: string
}

const toMeta = (collection: CollectionMetdata): InventoryCollection['meta'] => {
  return {
    name: collection.name,
    description: collection.description,
    image: collection.image,
    chainId: collection.chainId,
    external_url: ''
  }
}

const toItems = (collection: CollectionMetdata): InventoryCollection['items'] => {
  return collection.ownedItems.reduce((items, item) => {
    return {
      ...items,
      [item]: {}
    }
  }, {})
}

const toInventoryCollection = (collection: CollectionMetdata): InventoryCollection => {
  const meta = toMeta(collection)
  const items = toItems(collection)

  return {
    meta,
    items
  }
}

const toTokenBalance = (b: BalanceItem) => ({
  address: b.contract.toLowerCase(),
  chainId: b.chainId,
  name: b.name || '',
  symbol: b.symbol,
  balance: b.amount,
  decimals: b.decimals || 18,
  displayBalance: formatUnits(b.amount, b.decimals),
  logoURI: b.image || ''
})

const Surface = () => {
  const Pylon = createPylon('wss://api.pylon.link')
  const subscriptions: Record<string, Subscription> = {}
  const networks = Networks()
  const subscribe = async (addr: string) => {
    log.verbose('Surface subscribing to account...', { addr })
    const address = addr.toLowerCase()

    const fallback = setTimeout(() => {
      log.verbose('FAILED TO GET SNAPSHOT WITHIN 5 SECONDS OF SUBSCRIPTION: FALLING BACK TO SCAN')
      networks.update(address, [])
    }, 5_000)

    const onStopped = () => {
      // FIXME: does this update to start scanning once the subscription is stopped?
      log.verbose(`Subscription to ${address} stopped`)
      delete subscriptions[address]
    }

    const onError = (err: Error) => {
      // FIXME: need to handle server errors
      log.error(`Received error for subscription to ${address}`, err)
    }

    const sub = Pylon.accounts.subscribe(address, {
      onStarted() {
        log.verbose('subscribed to account')
      },
      onData: (data) => {
        log.verbose(`Got update for account ${address}`, { data })
        if (!data.length || !data[0]) return
        const [{ address: addr, ...chains }] = data
        clearTimeout(fallback)
        log.verbose('chains received...', { chains })

        const [chainIds, balances, inventory] = Object.entries(chains).reduce(
          (acc, [chainId, chain]) => {
            if (!chain || typeof chain === 'string' || !chain.balances || !chain.inventory) {
              log.verbose(`Invalid chain data for ${chainId}`)
              return acc
            }

            acc[0].push(Number(chainId))
            acc[1].push(...Object.values(chain.balances).map(toTokenBalance))

            const chainInventory = Object.keys(chain.inventory).reduce((inventory, collection) => {
              return {
                ...inventory,
                ...(chain.inventory?.[collection] && {
                  [collection.toLowerCase()]: toInventoryCollection(chain.inventory[collection])
                })
              }
            }, {} as Inventory)

            acc[2] = {
              ...acc[2],
              ...chainInventory
            }

            return acc
          },
          [[] as number[], [] as TokenBalance[], {} as Inventory]
        )

        bProcessor.handleBalanceUpdate(address, balances, chainIds, 'snapshot')
        iProcessor.setInventory(address, inventory)
        networks.update(address, chainIds)
      },
      onError,
      onStopped
    })

    subscriptions[address] = Object.assign(sub, { unsubscribables: [], collectionItems: [] })
  }

  const unsubscribe = async (address: string) => {
    log.verbose('Surface unsubscribing to account...', { address })
    const subscription = subscriptions[address]
    if (!subscription) return
    subscription.unsubscribables.forEach((u) => u.unsubscribe())
    subscription.unsubscribe()
    delete subscriptions[address]
    networks.update(address, [])
  }

  const stop = () => {
    Object.keys(subscriptions).forEach((address) => {
      unsubscribe(address)
    })
  }

  const close = () => {
    networks.close()
  }

  const updateSubscribers = (addresses: string[]) => {
    const removed = Object.keys(subscriptions).filter((address) => !addresses.includes(address))
    const added = addresses.filter((address) => !subscriptions[address])

    log.verbose('Updating surface subscribers', { addresses, added, removed })

    removed.forEach(unsubscribe)
    added.forEach(subscribe)
  }

  const subscribeToItems = (addr: string, items: CollectionItem[]) => {
    const account = addr.toLowerCase()
    const sub = Pylon.items.subscribe(items, {
      onStarted() {
        log.verbose(`Created subscription to items`, { account, items })
      },
      onData: (data) => {
        log.debug('Received update for items', { account, items: data })

        if (!data.length) return
        const assets = data.map((item) => ({
          name: item.name,
          tokenId: item.tokenId,
          img: item.image,
          contract: item.contract,
          ...(item.link && { externalLink: item.link })
        }))
        iProcessor.updateItems(account, assets)
      },
      onError: (err) => {
        log.error('Error subscribing to items', { account, items, err })
      }
    })

    subscriptions[account].unsubscribables.push(sub)
    subscriptions[account].collectionItems.push(...items)
  }

  setInterval(() => {
    const subscribers = Object.entries(subscriptions).map(([address, { collectionItems }]) => ({
      collectionItems,
      address
    }))

    if (!subscribers.length) return
    log.verbose('Updating subscriptions to surface...')

    Object.keys(subscriptions).forEach(unsubscribe)
    subscribers.forEach(({ address, collectionItems }) => {
      log.verbose('should be resubbing...', { collectionItems, address })
      subscribe(address)

      if (collectionItems.length > 0) {
        subscribeToItems(address, collectionItems)
      }
    })
  }, 1000 * 60 * 4)

  return {
    stop,
    updateSubscribers,
    networks,
    close,
    subscribeToItems
  }
}

const surface = Surface()

export default surface
