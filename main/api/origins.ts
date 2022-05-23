import { v5 as uuidv5 } from 'uuid'
import { IncomingMessage } from 'http'
import queryString from 'query-string'
import log from 'electron-log'

import accounts, { AccessRequest } from '../accounts'
import store from '../store'

const dev = process.env.NODE_ENV === 'development'

export function invalidOrigin (origin: string) {
  return origin !== origin.replace(/[^0-9a-z/:.[\]-]/gi, '')
}

export function getOriginId(originName: string) {
  return uuidv5(originName, uuidv5.DNS) as UUID<Origin>
}

export function updateOrigin (payload: JSONRPCRequestPayload, originName?: string, connectionMessage = false): RPCRequestPayload {
  if (!originName) {
    log.warn(`Received payload with no origin: ${JSON.stringify(payload)}`)
    return { ...payload, chainId: payload.chainId || '0x1', _origin: OriginType.Unknown }
  }

  const originId = getOriginId(originName)
  const existingOrigin = store('main.origins', originId)

  if (!existingOrigin && !connectionMessage) {
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
