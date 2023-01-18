import { v5 as uuidv5 } from 'uuid'
import { IncomingMessage } from 'http'
import queryString from 'query-string'

import accounts, { AccessRequest } from '../accounts'
import store from '../store'
import { ExtensionAccessRequest } from '../accounts/types'

const dev = process.env.NODE_ENV === 'development'
const protocolRegex = /^(?:ws|http)s?:\/\//

interface OriginUpdateResult {
  payload: RPCRequestPayload
  hasSession: boolean
}

type Browser = 'chrome' | 'firefox' | 'safari'

export interface FrameExtension {
  browser: Browser
  id: string
}

// allows the Frame extension to request specific methods
const trustedExtensionMethods = ['wallet_getEthereumChains']

const storeApi = {
  getPermission: (address: Address, origin: string) => {
    const permissions: Record<string, Permission> = store('main.permissions', address) || {}
    return Object.values(permissions).find((p) => p.origin === origin)
  },
  getKnownExtension: (id: string) => store('main.knownExtensions', id)
}

export function parseOrigin(origin?: string) {
  if (!origin) return 'Unknown'

  return origin.replace(protocolRegex, '')
}

function invalidOrigin(origin: string) {
  return origin !== origin.replace(/[^0-9a-z/:.[\]-]/gi, '')
}

async function getPermission(address: Address, origin: string, payload: RPCRequestPayload) {
  const permission = storeApi.getPermission(address, origin)

  return permission || requestPermission(address, payload)
}

async function requestExtensionPermission(extension: FrameExtension) {
  return new Promise<boolean>((resolve) => {
    const request: ExtensionAccessRequest = {
      handlerId: extension.id,
      type: 'extensionAccess',
      id: extension.id
    }

    accounts.addRequest(request, () => {
      const isAllowed = store('main.knownExtensions', extension.id)
      resolve(isAllowed)
    })
  })
}

async function requestPermission(address: Address, fullPayload: RPCRequestPayload) {
  const { _origin: originId, ...payload } = fullPayload

  return new Promise<Permission | undefined>((resolve) => {
    const request: AccessRequest = {
      payload,
      handlerId: originId,
      type: 'access',
      origin: originId,
      account: address
    }

    accounts.addRequest(request, () => {
      const { name: originName } = store('main.origins', originId)
      const permission = storeApi.getPermission(address, originName)

      resolve(permission)
    })
  })
}

export function updateOrigin(
  payload: JSONRPCRequestPayload,
  origin: string,
  connectionMessage = false
): OriginUpdateResult {
  let hasSession = false

  const originId = uuidv5(origin, uuidv5.DNS)
  const existingOrigin = store('main.origins', originId)
  if (!connectionMessage) {
    hasSession = true

    // the extension will attempt to send messages (eth_chainId and net_version) in order
    // to connect. we don't want to store these origins as they'll come from every site
    // the user visits in their browser

    if (existingOrigin) {
      store.addOriginRequest(originId)
    } else {
      store.initOrigin(originId, {
        name: origin,
        chain: {
          id: 1,
          type: 'ethereum'
        }
      })
    }
  }

  return {
    hasSession,
    payload: {
      ...payload,
      chainId: payload.chainId || `0x${(existingOrigin?.chain.id || 1).toString(16)}`,
      _origin: originId
    }
  }
}

export function parseFrameExtension(req: IncomingMessage): FrameExtension | false {
  const origin = req.headers.origin || ''

  const query = queryString.parse((req.url || '').replace('/', ''))
  const hasExtensionIdentity = query.identity === 'frame-extension'

  if (origin === 'chrome-extension://ldcoohedfbjoobcadoglnnmmfbdlmmhf') {
    // Match production chrome
    return { browser: 'chrome', id: 'ldcoohedfbjoobcadoglnnmmfbdlmmhf' }
  } else if (origin.startsWith('moz-extension://') && hasExtensionIdentity) {
    // Match production Firefox
    const extensionId = origin.substring(origin.indexOf('://') + 3)
    return { browser: 'firefox', id: extensionId }
  } else if (origin.startsWith('safari-web-extension://') && dev && hasExtensionIdentity) {
    // Match Safari in dev only
    return { browser: 'safari', id: 'frame-dev' }
  }

  return false
}

export async function isKnownExtension(extension: FrameExtension) {
  if (extension.browser === 'chrome' || extension.browser === 'safari') return true

  const knownExtension = storeApi.getKnownExtension(extension.id)

  return knownExtension || requestExtensionPermission(extension)
}

export async function isTrusted(payload: RPCRequestPayload) {
  // Permission granted to unknown origins only persist until the Frame is closed, they are not permanent
  const { name: originName } = store('main.origins', payload._origin) as { name: string }
  const currentAccount = accounts.current()

  if (originName === 'frame-extension' && trustedExtensionMethods.includes(payload.method)) {
    return true
  }

  if (invalidOrigin(originName) || !currentAccount) {
    return false
  }

  const permission = await getPermission(currentAccount.address, originName, payload)

  return !!permission?.provider
}
