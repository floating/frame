import { addHexPrefix } from '@ethereumjs/util'
import { randomBytes } from 'crypto'

export const enum SubscriptionType {
  ACCOUNTS = 'accountsChanged',
  ASSETS = 'assetsChanged',
  CHAIN = 'chainChanged',
  CHAINS = 'chainsChanged',
  NETWORK = 'networkChanged'
}

export type Subscription = {
  id: string
  originId: string
}
