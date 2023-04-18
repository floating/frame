import { v5 as uuid } from 'uuid'
import store from '../store'

import type { Permission } from '../store/state'

const trustedOriginIds = ['frame-extension', 'frame-internal'].map((origin) => uuid(origin, uuid.DNS))
const isTrustedOrigin = (originId: string) => trustedOriginIds.includes(originId)

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

export function hasSubscriptionPermission(subType: string, address: string, originId: string) {
  if (subType === SubscriptionType.CHAINS && isTrustedOrigin(originId)) {
    // internal trusted origins are allowed to subscribe to chain changes without approval
    return true
  }

  if (!address) {
    return false
  }

  const permissions = (store('main.permissions', address) || {}) as Record<string, Permission>
  const permission = Object.values(permissions).find(({ origin }) => {
    return uuid(origin, uuid.DNS) === originId
  })

  return !!permission?.provider
}
