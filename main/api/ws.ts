import WebSocket from 'ws'
import { v4 as uuid, v5 as uuidv5 } from 'uuid'
import  log from 'electron-log'

import store from '../store'
import provider, { ProviderDataPayload } from '../provider'
import accounts from '../accounts'
import windows from '../windows'

import { updateOrigin, isTrusted, isFrameExtension, parseOrigin } from './origins'
import validPayload from './validPayload'
import protectedMethods from './protectedMethods'
import { IncomingMessage, Server } from 'http'

const logTraffic = process.env.LOG_TRAFFIC

const subs: Record<string, Subscription> = {}
const connectionMonitors: Record<string, NodeJS.Timeout> = {}

interface Subscription {
  originId: string,
  socket: FrameWebSocket
}

interface FrameWebSocket extends WebSocket {
  id: string,
  origin?: string,
  isFrameExtension: boolean
}

interface ExtensionPayload extends JSONRPCRequestPayload {
  __frameOrigin?: string,
  __extensionConnecting?: boolean
}

const storeApi = {
  getPermissions: (address: Address) => {
    return store('main.permissions', address) as Record<string, Permission>
  }
}

function extendSession (originId: string) {
  if (originId) {
    clearTimeout(connectionMonitors[originId])

    connectionMonitors[originId] = setTimeout(() => {
      store.endOriginSession(originId)
    }, 60 * 1000)
  }
}

const handler = (socket: FrameWebSocket, req: IncomingMessage) => {
  socket.id = uuid()
  socket.origin = req.headers.origin
  socket.isFrameExtension = isFrameExtension(req)

  const res = (payload: RPCResponsePayload) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload), err => { if (err) log.info(err) })
    }
  }

  socket.on('message', async data => {
    const rawPayload = validPayload<ExtensionPayload>(data.toString())
    if (!rawPayload) return console.warn('Invalid Payload', data)

    let requestOrigin = socket.origin
    if (socket.isFrameExtension) { // Request from extension, swap origin
      if (rawPayload.__frameOrigin) {
        requestOrigin = rawPayload.__frameOrigin
        delete rawPayload.__frameOrigin
      } else {
        requestOrigin = 'frame-extension'
      }
    }

    const origin = parseOrigin(requestOrigin)

    // Extension custom action for summoning Frame
    if (origin === 'frame-extension' && rawPayload.method === 'frame_summon') return windows.toggleTray()
    if (logTraffic) log.info(`req -> | ${(socket.isFrameExtension ? 'ext' : 'ws')} | ${origin} | ${rawPayload.method} | -> | ${rawPayload.params}`)

    const { payload, hasSession } = updateOrigin(rawPayload, origin, rawPayload.__extensionConnecting)

    if (hasSession) {
      extendSession(payload._origin)
    }

    if (protectedMethods.indexOf(payload.method) > -1 && !(await isTrusted(origin))) {
      let error = { message: 'Permission denied, approve ' + origin + ' in Frame to continue', code: 4001 }
      // review
      if (!accounts.getSelectedAddresses()[0]) error = { message: 'No Frame account selected', code: 4001 }
      res({ id: payload.id, jsonrpc: payload.jsonrpc, error })
    } else {
      provider.send(payload, response => {
        if (response && response.result) {
          if (payload.method === 'eth_subscribe') {
            subs[response.result] = { socket, originId: payload._origin }
          } else if (payload.method === 'eth_unsubscribe') {
            payload.params.forEach(sub => { if (subs[sub]) delete subs[sub] })
          }
        }
        if (logTraffic) log.info(`<- res | ${(socket.isFrameExtension ? 'ext' : 'ws')} | ${origin} | ${payload.method} | <- | ${JSON.stringify(response.result || response.error)}`)

        res(response)
      })
    }
  })
  socket.on('error', err => log.error(err))
  socket.on('close', _ => {
    Object.keys(subs).forEach(sub => {
      if (subs[sub].socket.id === socket.id) {
        provider.send({ jsonrpc: '2.0', id: 1, method: 'eth_unsubscribe', _origin: subs[sub].originId, params: [sub] })
        delete subs[sub]
      }
    })
  })
}

export default function (server: Server) {
  const ws = new WebSocket.Server({ server })
  ws.on('connection', handler)
  // Send data to the socket that initiated the subscription
  provider.on('data', ({ origin, ...payload }: ProviderDataPayload) => {
    const subscription = subs[payload.params.subscription]

    // if an origin is passed, make sure the subscription is from that origin
    if (subscription && (!origin || origin === subscription.originId)) {
      subscription.socket.send(JSON.stringify(payload))
    }
  })

  provider.on('data:address', (address, payload) => { // Make sure the subscription has access based on current account
    const subscription = subs[payload.params.subscription]
    if (subscription) {
      const permissions = storeApi.getPermissions(address) || {}
      const permission = Object.values(permissions).find(({ origin }) => {
        const originId = uuidv5(origin, uuidv5.DNS)
        return originId === subscription.originId
      }) || { provider: false }

      if (!permission.provider) payload.params.result = []
      subscription.socket.send(JSON.stringify(payload))
    }
  })

  return server
}
