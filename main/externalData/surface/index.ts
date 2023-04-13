import createPylon from '@framelabs/pylon-api-client'
import { BalanceProcessor } from '../balances/processor'

type Subscription = ReturnType<ReturnType<typeof createPylon>['accounts']['subscribe']>

//TODO export these from surface...
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
  Exclude<Parameters<(typeof pylon)['accounts']['subscribe']>['1']['onData'], undefined>
>[0][0]

const pylon = createPylon('ws://localhost:9000')
const subscriptions: Record<string, Subscription> = {}

const subscribe = async (address: string, processor: BalanceProcessor) => {
  const sub = pylon.accounts.subscribe(address, {
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
      processor.handleAccountUpdate(account)
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

const updateSubscribers = (store: Store, processor: BalanceProcessor) => {
  // const observer = store.observer(() => {
  const accounts = store('main.accounts')
  Object.keys(subscriptions).forEach((address) => {
    if (!accounts[address]) {
      unsubscribe(address)
    }
  })

  Object.keys(accounts).forEach((address) => {
    if (!subscriptions[address]) {
      subscribe(address, processor)
    }
  })
  // })

  // return observer
}

const isMonitoring = () => Object.keys(subscriptions).length > 0
const getChains = () => [1, 137, 80001] //TODO: assign this from the subscriptions somehow...

export default {
  stop,
  isMonitoring,
  updateSubscribers,
  getChains
}
