import { v5 as uuidv5 } from 'uuid'
import { IncomingMessage } from 'http'
import queryString from 'query-string'
import log from 'electron-log'

import accounts, { AccessRequest } from '../accounts'
import store from '../store'

const dev = process.env.NODE_ENV === 'development'

interface ExtensionPayload extends JSONRPCRequestPayload {
  chainId?: string,
  __frameOrigin?: string,
  __extensionConnecting?: boolean
}

function invalidOrigin (origin: string) {
  return origin !== origin.replace(/[^0-9a-z/:.[\]-]/gi, '')
}

function addPermissionRequest (address: Address, origin: string) {
  return new Promise((resolve, reject) => {
    const handlerId = uuidv5(origin, uuidv5.DNS)
    const request: AccessRequest = { payload: undefined as any, handlerId, type: 'access', origin: handlerId, account: address }

    accounts.addRequest(request, () => {
      const permissions = store('main.permissions', address) || {}
      const perms = Object.keys(permissions).map(id => permissions[id])
      const permIndex = perms.map(p => p.origin).indexOf(origin)
      if (perms[permIndex] && perms[permIndex].provider) {
        resolve(true)
      } else {
        reject(new Error('Origin does not have provider permissions'))
      }
    })
  })
}

export function updateOrigin (payload: ExtensionPayload, originName?: string): RPCRequestPayload {
  if (!originName) {
    log.warn(`Received payload with no origin: ${JSON.stringify(payload)}`)
    return { ...payload, chainId: payload.chainId || '0x1', _origin: 'Unknown' }
  }

  const originId = uuidv5(originName, uuidv5.DNS)
  const existingOrigin = store('main.origins', originId)

  if (!existingOrigin && !payload.__extensionConnecting) {
    // the extension will attempt to send messages (eth_chainId and net_version) in order
    // to connect. we don't want to store these origins as they'll come from every site
    // the user visits in their browser
    store.initOrigin(originId, {
      name: originName,
      chain: {
        id: 1,
        type: 'ethereum'
      }
    })
  }

  return {
    ...payload,
    chainId: payload.chainId || `0x${(existingOrigin?.chain.id || 1).toString(16)}`,
    _origin: originId
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

export async function isTrusted (origin?: string) {
  if (!origin || origin === 'null') origin = 'Unknown' // Permission granted to unknown origins only persist until the Frame is closed, they are not permanent
  if (invalidOrigin(origin)) return false
  if (origin === 'frame-extension') return true
  const account = accounts.current()
  if (!account) return
  const address = account.address
  if (!address) return
  const permissions = store('main.permissions', address) || {}
  const perms = Object.keys(permissions).map(id => permissions[id])
  const permIndex = perms.map(p => p.origin).indexOf(origin)
  if (permIndex === -1) {
    try {
      return await addPermissionRequest(address, origin)
    } catch (e) {
      log.error(e)
      return false
    }
  } else {
    return perms[permIndex] && perms[permIndex].provider
  }
}
