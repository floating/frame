import createPylon from '@framelabs/pylon-api-client'
import { BalanceProcessor } from '../balances/processor'
import { InventoryProcessor } from '../inventory/processor'

type Subscription = ReturnType<ReturnType<typeof createPylon>['client']['accounts']['subscribe']>

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

const Surface = () => {
  const pylon = createPylon('ws://localhost:9000')
  const subscriptions: Record<string, Subscription> = {}
  const networks = new Set<number>([1, 137, 80001]) //TODO: populate from updates...

  const subscribe = async (address: string, bProcessor: BalanceProcessor, iProcessor: InventoryProcessor) => {
    const sub = pylon.client.accounts.subscribe(address, {
      onStarted() {
        console.log('subscribed to account')
      },
      onData: (data) => {
        console.log('got update for account', { data })
        if (!data.length || !data[0]) return
        const [{ address, ...chains }] = data
        const account: Account = {
          address: address as unknown as string,
          inventory: {},
          balances: {}
        }

        console.log('chains received...', { chains })

        Object.values(chains).forEach((chain) => {
          if (!chain) return
          const { inventory, balances } = chain as unknown as AccountResponse[0]
          account.balances = { ...account.balances, ...balances }
          account.inventory = { ...account.inventory, ...inventory }
        })

        console.log('account subscribed...', { account })
        bProcessor.updateAccount(account)
        iProcessor.updateAccount(account)
      },
      onError: (err: unknown) => {
        console.error({ err })
      }
    })

    subscriptions[address.toLowerCase()] = Object.assign(sub, { address })
  }

  const unsubscribe = async (address: string) => {
    subscriptions[address]?.unsubscribe()
    delete subscriptions[address]
  }

  const stop = () => {
    Object.keys(subscriptions).forEach((address) => {
      unsubscribe(address)
    })
  }

  const close = () => pylon.wsClient.close()

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

  return {
    stop,
    updateSubscribers,
    networks,
    close
  }
}

export default Surface
