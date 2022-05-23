import { v5 as uuidv5 } from 'uuid'
import log from 'electron-log'
import store from '../store'

interface ExtensionPayload extends JSONRPCRequestPayload {
  chainId?: string,
  __frameOrigin?: string,
  __extensionConnecting?: boolean
}

export function updateOrigin (payload: ExtensionPayload, originName: string) {
  if (!originName) {
    log.warn(`Received payload with no origin: ${payload.method}`)

    //log.warn(`Received payload with no origin: ${JSON.stringify(payload)}`)
    return { ...payload, chainId: payload.chainId || '0x1' }
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
