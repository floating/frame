import log from 'electron-log'
import createPylon, { Unsubscribable } from '@framelabs/pylon-api-client'

import Networks from './networks'
import { BalanceProcessor } from '../balances/processor'
import { InventoryProcessor } from '../inventory/processor'

type Subscription = Unsubscribable & {
  items: Unsubscribable[]
}

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

export type Account = {
  address: string
  inventory: Record<string, CollectionMetdata>
  balances: Record<string, BalanceItem>
}

export interface CollectionItem {
  link: string
  chainId: number
  contract: string
  tokenId: string
  name: string
  image: string
  description: string
}

export interface CollectionItem {
  contract: string
  chainId: number
  tokenId: string
}

const Pylon = createPylon('ws://localhost:9000')

const Surface = () => {
  const subscriptions: Record<string, Subscription> = {}
  const networks = Networks()

  const subscribe = async (address: string, bProcessor: BalanceProcessor, iProcessor: InventoryProcessor) => {
    const sub = Pylon.accounts.subscribe(address, {
      onStarted() {
        log.verbose('subscribed to account')
      },
      onData: (data) => {
        log.verbose('got update for account', { data })
        if (!data.length || !data[0]) return
        const [{ address, ...chains }] = data
        const account: Account = {
          address,
          inventory: {},
          balances: {}
        }

        log.verbose('chains received...', { chains })

        const chainIds: number[] = []
        Object.entries(chains).forEach(([chainId, chain]) => {
          chainIds.push(Number(chainId))
          if (!chain) return
          const { inventory, balances } = chain as unknown as Account
          account.balances = { ...account.balances, ...balances }
          account.inventory = { ...account.inventory, ...inventory }
        })

        bProcessor.updateAccount(account)
        iProcessor.updateAccount(account)
        networks.update(chainIds)
      },
      onError: (err: unknown) => {
        console.error({ err })
      },
      onStopped() {
        delete subscriptions[address.toLowerCase()]
      }
    })

    subscriptions[address.toLowerCase()] = Object.assign(sub, { items: [] })
  }

  const unsubscribe = async (address: string) => {
    const subscription = subscriptions[address]
    if (!subscription) return
    subscription.items.forEach((sub) => sub.unsubscribe())
    subscription.unsubscribe()

    delete subscriptions[address]
  }

  const stop = () => {
    Object.keys(subscriptions).forEach((address) => {
      unsubscribe(address)
    })
  }

  const close = () => {
    networks.close()
  }

  const updateSubscribers = (store: Store, bProcessor: BalanceProcessor, iProcessor: InventoryProcessor) => {
    const accounts = store('main.accounts')
    Object.keys(subscriptions).forEach((address) => {
      if (!accounts[address]) {
        unsubscribe(address)
      }
    })

    Object.keys(accounts).forEach((address) => {
      if (!subscriptions[address]) {
        subscribe(address, bProcessor, iProcessor)
      }
    })
  }

  const subscribeToItems = (account: string, items: CollectionItem[], iProcessor: InventoryProcessor) => {
    const sub = Pylon.items.subscribe(items, {
      onStarted() {
        log.verbose(`Created subscription to items`, { account, items })
      },
      onData: (data) => {
        log.debug('Received update for items', { account, items: data })

        if (!data.length) return
        const items = data.filter(Boolean) as CollectionItem[]
        iProcessor.updateItems(account, items)
      },
      onError: (err) => {
        log.error('Error subscribing to items', { account, items, err })
      }
    })

    subscriptions[account.toLowerCase()].items.push(sub)
  }

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
