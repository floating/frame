import log from 'electron-log'
import createPylon from '@framelabs/pylon-api-client'
import { BalanceProcessor } from '../balances/processor'
import { InventoryProcessor } from '../inventory/processor'
import Networks from './networks'
type Subscription = ReturnType<ReturnType<typeof createPylon>['client']['accounts']['subscribe']> & {
  items: ReturnType<ReturnType<typeof createPylon>['client']['items']['subscribe']>[]
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

export type AccountResponse = Parameters<
  Exclude<
    Parameters<ReturnType<typeof createPylon>['client']['accounts']['subscribe']>['1']['onData'],
    undefined
  >
>[0][0]

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

const pylon = createPylon('ws://localhost:9000')

const Surface = () => {
  const subscriptions: Record<string, Subscription> = {}
  const networks = Networks()

  const subscribe = async (address: string, bProcessor: BalanceProcessor, iProcessor: InventoryProcessor) => {
    const sub = pylon.client.accounts.subscribe(address, {
      onStarted() {
        log.verbose('subscribed to account')
      },
      onData: (data) => {
        log.verbose('got update for account', { data })
        if (!data.length || !data[0]) return
        const [{ address, ...chains }] = data
        const account: Account = {
          address: address as unknown as string,
          inventory: {},
          balances: {}
        }

        log.verbose('chains received...', { chains })

        const chainIds: number[] = []
        Object.entries(chains).forEach(([chainId, chain]) => {
          chainIds.push(Number(chainId))
          if (!chain) return
          const { inventory, balances } = chain as unknown as AccountResponse[0]
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
    pylon.wsClient.close()
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
    const sub = pylon.client.items.subscribe(items, {
      onStarted() {},
      onData: (data) => {
        log.verbose('got update for items', { data })
        if (!data.length) return
        const items = data.filter(Boolean) as CollectionItem[]
        iProcessor.updateItems(account, items)
      },
      onError: (err: unknown) => {}
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
