import { v5 as uuidv5 } from 'uuid'
import { IncomingMessage } from 'http'
import queryString from 'query-string'
import log from 'electron-log'

import accounts, { AccessRequest } from '../accounts'
import store from '../store'

const dev = process.env.NODE_ENV === 'development'
const protocolRegex = /^(?:ws|http)s?:\/\//

interface OriginUpdateResult {
  payload: RPCRequestPayload,
  hasSession: boolean
}

export function parseOrigin (origin?: string) {
  if (!origin) return 'Unknown'

  return origin.replace(protocolRegex, '')
}

function isRealOrigin (origin: string) {
  return origin !== 'Unknown'
}

function invalidOrigin (origin: string) {
  return origin !== origin.replace(/[^0-9a-z/:.[\]-]/gi, '')
}

function addPermissionRequest (address: Address, fullPayload: RPCRequestPayload) {
  const { _origin: originId, ...payload } = fullPayload

  return new Promise((resolve, reject) => {
    const request: AccessRequest = { payload, handlerId: originId, type: 'access', origin: originId, account: address }

    accounts.addRequest(request, () => {
      const { name: originName } = store('main.origins', originId)
      const permissions = store('main.permissions', address) || {}
      const perms = Object.keys(permissions).map(id => permissions[id])
      const permIndex = perms.map(p => p.origin).indexOf(originName)
      if (perms[permIndex] && perms[permIndex].provider) {
        resolve(true)
      } else {
        reject(new Error('Origin does not have provider permissions'))
      }
    })
  })
}

export function updateOrigin (payload: JSONRPCRequestPayload, origin: string, connectionMessage = false): OriginUpdateResult {
  let hasSession = false

  const originId = uuidv5(origin, uuidv5.DNS)
  const existingOrigin = store('main.origins', originId)
  if (!connectionMessage && isRealOrigin(origin)) {
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

export function isFrameExtension (req: IncomingMessage) {
  const origin = req.headers.origin
  if (!origin) return false

  const query = queryString.parse((req.url || '').replace('/', ''))
  const mozOrigin = origin.startsWith('moz-extension://') 
  const extOrigin = origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://') || origin.startsWith('safari-web-extension://')

  if (origin === 'chrome-extension://ldcoohedfbjoobcadoglnnmmfbdlmmhf') { // Match production chrome
    return true
  } else if (mozOrigin || (dev && extOrigin)) {
    // In production, match any Firefox extension origin where query.identity === 'frame-extension'
    // In dev, match any extension where query.identity === 'frame-extension'
    return query.identity === 'frame-extension'
  } else {
    return false
  }
}

export async function isTrusted (payload: RPCRequestPayload) {
  // Permission granted to unknown origins only persist until the Frame is closed, they are not permanent
  const { name: originName } = store('main.origins', payload._origin)

  if (invalidOrigin(originName)) return false
  if (originName === 'frame-extension') return true
  const account = accounts.current()
  if (!account) return
  const address = account.address
  if (!address) return
  const permissions = store('main.permissions', address) || {}
  const perms = Object.keys(permissions).map(id => permissions[id])
  const permIndex = perms.map(p => p.origin).indexOf(originName)
  if (permIndex === -1) {
    try {
      return await addPermissionRequest(address, payload)
    } catch (e) {
      log.error(e)
      return false
    }
  } else {
    return perms[permIndex] && perms[permIndex].provider
  }
}
